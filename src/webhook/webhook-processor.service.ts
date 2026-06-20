// src/webhook/webhook-processor.service.ts
/**
 * WebhookProcessorService
 * ─────────────────────────
 * يعالج كل أنواع الأحداث الواردة ويحدّث المخزون المركزي.
 *
 * منطق تحديث الكمية حسب نوع الحدث:
 *  - sale          → اطرح الكمية المباعة
 *  - stock_added   → أضف الكمية
 *  - stock_removed → اطرح الكمية
 *  - return        → أضف الكمية المُرجعة
 *  - shortage      → سجّل فقط (لا تغيير في الكمية تلقائياً)
 *  - stock_update  → اضبط الكمية مباشرة (current_quantity)
 */
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { MedicineResolverService } from './medicine-resolver.service';
import { WebhookPayloadDto, WebhookEventType, MedicinePayloadDto } from './dto/webhook-payload.dto';

@Injectable()
export class WebhookProcessorService {
  private readonly logger = new Logger(WebhookProcessorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly medicineResolver: MedicineResolverService,
  ) {}

  async processWebhook(
    pharmacyId: number,
    payload: WebhookPayloadDto,
    logId: number,
  ): Promise<void> {
    try {
      for (const medicine of payload.medicines) {
        await this.processMedicine(pharmacyId, payload.event_type, medicine);
      }

      // حدّث سجل الـ webhook كـ "processed"
      await this.prisma.webhookLog.update({
        where: { id: logId },
        data: { status: 'processed', processedAt: new Date() },
      });
    } catch (error) {
      this.logger.error(`Failed to process webhook #${logId}: ${error.message}`);
      await this.prisma.webhookLog.update({
        where: { id: logId },
        data: { status: 'failed', errorMsg: error.message },
      });
      throw error;
    }
  }

  private async processMedicine(
    pharmacyId: number,
    eventType: WebhookEventType,
    medicine: MedicinePayloadDto,
  ): Promise<void> {
    // الخطوة 1: حدّد أو أنشئ الدواء في القاعدة المركزية
    const masterMedicineId = await this.medicineResolver.resolveOrCreate(medicine, pharmacyId);

    // الخطوة 2: احسب الكمية الجديدة
    const quantityDelta = this.calculateQuantityDelta(eventType, medicine);

    // الخطوة 3: حدّث أو أنشئ سجل المخزون
    await this.upsertStock(pharmacyId, masterMedicineId, medicine, quantityDelta, eventType);

    this.logger.log(
      `[${eventType}] Pharmacy#${pharmacyId} | Medicine#${masterMedicineId} | Δ${quantityDelta > 0 ? '+' : ''}${quantityDelta}`
    );
  }

  /**
   * احسب تغيير الكمية (+/-) بناءً على نوع الحدث
   */
  private calculateQuantityDelta(
    eventType: WebhookEventType,
    medicine: MedicinePayloadDto,
  ): number {
    const qty = Math.abs(medicine.quantity_affected);

    switch (eventType) {
      case WebhookEventType.SALE:
        return -qty;  // البيع ينقص المخزون

      case WebhookEventType.STOCK_ADDED:
        return +qty;  // إضافة مخزون يزيده

      case WebhookEventType.STOCK_REMOVED:
        return -qty;  // الحذف ينقص المخزون

      case WebhookEventType.RETURN:
        return +qty;  // الإرجاع يعيد الكمية

      case WebhookEventType.SHORTAGE:
        return 0;     // النقص يُسجَّل فقط بدون تغيير تلقائي

      case WebhookEventType.STOCK_UPDATE:
        // في هذه الحالة current_quantity هو الكمية الفعلية الجديدة
        // يُعالج بشكل مختلف في upsertStock
        return medicine.current_quantity ?? 0;

      default:
        return 0;
    }
  }

  private async upsertStock(
    pharmacyId: number,
    masterMedicineId: number,
    medicine: MedicinePayloadDto,
    quantityDelta: number,
    eventType: WebhookEventType,
  ): Promise<void> {
    const existing = await this.prisma.pharmacyStock.findUnique({
      where: { pharmacyId_masterMedicineId: { pharmacyId, masterMedicineId } },
    });

    // لـ STOCK_UPDATE: اضبط الكمية مباشرة بدلاً من الجمع
    const isAbsoluteUpdate = eventType === WebhookEventType.STOCK_UPDATE;

    const newQuantity = isAbsoluteUpdate
      ? quantityDelta
      : Math.max(0, (existing?.quantity ?? 0) + quantityDelta);

    await this.prisma.pharmacyStock.upsert({
      where: { pharmacyId_masterMedicineId: { pharmacyId, masterMedicineId } },
      create: {
        pharmacyId,
        masterMedicineId,
        quantity:       newQuantity,
        price:          medicine.price ?? null,
        expiryDate:     medicine.expiry_date ? new Date(medicine.expiry_date) : null,
        unit:           medicine.unit ?? null,
        tabletsPerBox:  medicine.tablets_per_box ?? null,
        localMedicineId: medicine.local_medicine_id,
        lastSyncAt:     new Date(),
      },
      update: {
        quantity:     newQuantity,
        price:        medicine.price ?? undefined,
        expiryDate:   medicine.expiry_date ? new Date(medicine.expiry_date) : undefined,
        unit:         medicine.unit ?? undefined,
        tabletsPerBox: medicine.tablets_per_box ?? undefined,
        lastSyncAt:   new Date(),
      },
    });
  }
}
