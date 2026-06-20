// src/webhook/medicine-resolver.service.ts
/**
 * MedicineResolverService
 * ────────────────────────
 * هذه الخدمة هي قلب النظام:
 * تستقبل بيانات دواء من صيدلية وتحدّد ما إذا كان موجوداً في قاعدتنا المركزية.
 *
 * منطق التطابق (بالأولوية):
 *  1. الباركود (barcode)  ← الأقوى والأدق
 *  2. اسم الدواء (name)   ← بعد تنظيف وتوحيد النص
 *  3. الاسم التجاري (trad_name)
 *  4. إنشاء دواء جديد إذا لم يُوجد تطابق
 */
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { MedicinePayloadDto } from './dto/webhook-payload.dto';

@Injectable()
export class MedicineResolverService {
  private readonly logger = new Logger(MedicineResolverService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * الوظيفة الرئيسية: ابحث عن الدواء أو أنشئه
   * @returns masterMedicineId
   */
  async resolveOrCreate(
    medicine: MedicinePayloadDto,
    pharmacyId: number,
  ): Promise<number> {
    // ── المرحلة 1: البحث بالباركود ─────────────────────────────────────────
    if (medicine.barcode) {
      const byBarcode = await this.prisma.masterMedicine.findUnique({
        where: { barcode: medicine.barcode },
      });

      if (byBarcode) {
        this.logger.debug(`[Barcode Match] "${medicine.name}" → master #${byBarcode.id}`);
        // سجّل الاسم البديل إن كان مختلفاً
        await this.upsertAlias(byBarcode.id, medicine, pharmacyId);
        return byBarcode.id;
      }
    }

    // ── المرحلة 2: البحث بالاسم الموحَّد ──────────────────────────────────
    const normalizedName = this.normalizeName(medicine.name);

    const byAlias = await this.prisma.medicineAlias.findFirst({
      where: {
        aliasName: { equals: normalizedName},
        OR: [{ pharmacyId }, { pharmacyId: null }],
      },
    });

    if (byAlias) {
      this.logger.debug(`[Alias Match] "${medicine.name}" → master #${byAlias.masterMedicineId}`);
      return byAlias.masterMedicineId;
    }

    // ── المرحلة 3: البحث بالاسم التجاري ──────────────────────────────────
    if (medicine.trad_name) {
      const normalizedTrad = this.normalizeName(medicine.trad_name);
      const byTrad = await this.prisma.medicineAlias.findFirst({
        where: {
          tradName: { equals: normalizedTrad},
        },
      });
      if (byTrad) {
        this.logger.debug(`[TradName Match] "${medicine.trad_name}" → master #${byTrad.masterMedicineId}`);
        await this.upsertAlias(byTrad.masterMedicineId, medicine, pharmacyId);
        return byTrad.masterMedicineId;
      }
    }

    // ── المرحلة 4: إنشاء دواء جديد أو استرداده إذا تكرر الباركود ────────
    this.logger.log(`[New Medicine] Creating master entry for "${medicine.name}"`);

    let newMaster: { id: number };

    if (medicine.barcode) {
      // استخدم upsert — إذا كان الباركود موجوداً مسبقاً نسترده بدلاً من الفشل
      newMaster = await this.prisma.masterMedicine.upsert({
        where: { barcode: medicine.barcode },
        create: {
          barcode:        medicine.barcode,
          canonicalName:  medicine.name,
          scientificName: medicine.scientific_name ?? null,
          category:       medicine.category        ?? null,
          unit:           medicine.unit            ?? null,
          tabletsPerBox:  medicine.tablets_per_box ?? null,
        },
        update: {
          // نحدّث الاسم والتصنيف إن كانت أحدث
          canonicalName:  medicine.name,
          scientificName: medicine.scientific_name ?? undefined,
          category:       medicine.category        ?? undefined,
          unit:           medicine.unit            ?? undefined,
          tabletsPerBox:  medicine.tablets_per_box ?? undefined,
        },
      });
    } else {
      // بدون باركود — create مباشرة (null لا يُطبَّق عليه unique constraint)
      newMaster = await this.prisma.masterMedicine.create({
        data: {
          barcode:        null,
          canonicalName:  medicine.name,
          scientificName: medicine.scientific_name ?? null,
          category:       medicine.category        ?? null,
          unit:           medicine.unit            ?? null,
          tabletsPerBox:  medicine.tablets_per_box ?? null,
        },
      });
    }

    // سجّل الاسم الأول كـ alias
    await this.upsertAlias(newMaster.id, medicine, pharmacyId);
    return newMaster.id;
  }

  // ── تسجيل أو تحديث اسم بديل للدواء ────────────────────────────────────────
  private async upsertAlias(
    masterMedicineId: number,
    medicine: MedicinePayloadDto,
    pharmacyId: number,
  ) {
    const normalizedName = this.normalizeName(medicine.name);
    await this.prisma.medicineAlias.upsert({
      where: {
        aliasName_pharmacyId: { aliasName: normalizedName, pharmacyId },
      },
      create: {
        masterMedicineId,
        aliasName:      normalizedName,
        pharmacyId,
        localMedicineId: medicine.local_medicine_id,
        tradName:       medicine.trad_name ?? null,
      },
      update: {
        localMedicineId: medicine.local_medicine_id,
        tradName:       medicine.trad_name ?? null,
      },
    });
  }

  /**
   * تنظيف وتوحيد أسماء الأدوية للمقارنة
   * - إزالة المسافات الزائدة
   * - تحويل للأحرف الصغيرة
   * - إزالة علامات التشكيل في العربية
   * - إزالة كلمات شائعة مثل "mg", "ml", "tab", "cap"
   */
  normalizeName(name: string): string {
    return name
      .trim()
      .toLowerCase()
      // إزالة التشكيل العربي
      .replace(/[\u064B-\u065F]/g, '')
      // إزالة وحدات الجرعة الشائعة من الاسم لتحسين التطابق
      .replace(/\b\d+\s*(mg|ml|mcg|iu|g|kg)\b/gi, '')
      // إزالة أشكال العبوة
      .replace(/\b(tab|cap|syrup|susp|inj|amp|vial|cream|gel|drops?)\b/gi, '')
      // تنظيف المسافات
      .replace(/\s+/g, ' ')
      .trim();
  }
}