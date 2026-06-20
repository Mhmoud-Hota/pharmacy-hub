// src/inventory/bulk-import.service.ts
/**
 * BulkImportService
 * ──────────────────
 * يستورد المخزون الكامل لصيدلية دفعةً واحدة.
 *
 * الفرق عن webhook:
 *  - webhook: حدث واحد (بيع/إضافة) → كمية متغيّرة (+/-)
 *  - bulk import: قائمة كاملة → الكمية المُرسَلة هي الرصيد الفعلي الحالي
 *
 * يُستخدم لـ:
 *  1. المخزون الأولي عند تسجيل صيدلية جديدة
 *  2. المزامنة الدورية (مرة في اليوم مثلاً) للتصحيح
 *  3. بعد أي عملية جرد يدوي
 */
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { MedicineResolverService } from '../webhook/medicine-resolver.service';
import { BulkImportDto, StockItemDto } from './dto/bulk-import.dto';
import { MedicinePayloadDto } from '../webhook/dto/webhook-payload.dto';

export interface ImportProgress {
  total:     number;
  processed: number;
  created:   number;   // أدوية جديدة أُضيفت لقاعدة المركز
  updated:   number;   // أدوية موجودة حُدّث مخزونها
  skipped:   number;   // أدوية فشل معالجتها
  errors:    string[];
}

@Injectable()
export class BulkImportService {
  private readonly logger = new Logger(BulkImportService.name);
  // BATCH_SIZE: معالجة X دواء في كل مرة لتجنب ضغط قاعدة البيانات
  private readonly BATCH_SIZE = 50;

  constructor(
    private readonly prisma: PrismaService,
    private readonly medicineResolver: MedicineResolverService,
  ) {}

  /**
   * الوظيفة الرئيسية: استيراد مخزون صيدلية كامل
   */
  async importPharmacyStock(
    pharmacyId: number,
    dto: BulkImportDto,
  ): Promise<ImportProgress> {
    const progress: ImportProgress = {
      total:     dto.medicines.length,
      processed: 0,
      created:   0,
      updated:   0,
      skipped:   0,
      errors:    [],
    };

    this.logger.log(
      `[BulkImport] Pharmacy#${pharmacyId} | ${dto.medicines.length} medicines | replace=${dto.replace_existing}`
    );

    // ── إذا replace_existing: احذف المخزون القديم أولاً ──────────────────
    if (dto.replace_existing) {
      const deleted = await this.prisma.pharmacyStock.deleteMany({
        where: { pharmacyId },
      });
      this.logger.log(`[BulkImport] Cleared ${deleted.count} old stock entries`);
    }

    // ── معالجة على دفعات لتجنب ضغط DB ──────────────────────────────────
    const batches = this.chunk(dto.medicines, this.BATCH_SIZE);

    for (const batch of batches) {
      await Promise.allSettled(
        batch.map(item =>
          this.processOneItem(pharmacyId, item, progress)
        )
      );
    }

    this.logger.log(
      `[BulkImport] Done | created=${progress.created} updated=${progress.updated} skipped=${progress.skipped}`
    );

    return progress;
  }

  /**
   * معالجة دواء واحد:
   * 1. حدّد أو أنشئ الدواء في القاعدة المركزية (نفس منطق الـ webhook)
   * 2. اضبط الكمية مباشرةً (upsert)
   */
  private async processOneItem(
    pharmacyId: number,
    item: StockItemDto,
    progress: ImportProgress,
  ): Promise<void> {
    try {
      // نحوّل StockItemDto → MedicinePayloadDto لاستخدام نفس الـ resolver
      const medicinePayload: MedicinePayloadDto = {
        barcode:          item.barcode,
        name:             item.name,
        trad_name:        item.trad_name,
        scientific_name:  item.scientific_name,
        local_medicine_id: item.local_medicine_id,
        quantity_affected: item.quantity,   // هنا الكمية = الرصيد الكامل
        current_quantity:  item.quantity,
        price:            item.price,
        unit:             item.unit,
        tablets_per_box:  item.tablets_per_box,
        expiry_date:      item.expiry_date,
        category:         item.category,
      };

      const masterMedicineId = await this.medicineResolver.resolveOrCreate(
        medicinePayload,
        pharmacyId,
      );

      // تحقق هل السجل موجود مسبقاً
      const existing = await this.prisma.pharmacyStock.findUnique({
        where: { pharmacyId_masterMedicineId: { pharmacyId, masterMedicineId } },
      });

      // upsert بالكمية الفعلية الحالية (ليس +/-)
      await this.prisma.pharmacyStock.upsert({
        where: { pharmacyId_masterMedicineId: { pharmacyId, masterMedicineId } },
        create: {
          pharmacyId,
          masterMedicineId,
          quantity:        item.quantity,
          price:           item.price   ?? null,
          expiryDate:      item.expiry_date ? new Date(item.expiry_date) : null,
          unit:            item.unit    ?? null,
          tabletsPerBox:   item.tablets_per_box ?? null,
          localMedicineId: item.local_medicine_id,
          lastSyncAt:      new Date(),
        },
        update: {
          quantity:        item.quantity,
          price:           item.price   ?? undefined,
          expiryDate:      item.expiry_date ? new Date(item.expiry_date) : undefined,
          unit:            item.unit    ?? undefined,
          tabletsPerBox:   item.tablets_per_box ?? undefined,
          localMedicineId: item.local_medicine_id,
          lastSyncAt:      new Date(),
        },
      });

      existing ? progress.updated++ : progress.created++;
      progress.processed++;

    } catch (err) {
      progress.skipped++;
      progress.processed++;
      progress.errors.push(`[${item.name}] ${err.message}`);
      this.logger.warn(`[BulkImport] Skipped "${item.name}": ${err.message}`);
    }
  }

  private chunk<T>(arr: T[], size: number): T[][] {
    const out: T[][] = [];
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
    return out;
  }
}
