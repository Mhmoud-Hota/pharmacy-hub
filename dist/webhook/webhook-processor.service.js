"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var WebhookProcessorService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookProcessorService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../database/prisma.service");
const medicine_resolver_service_1 = require("./medicine-resolver.service");
const webhook_payload_dto_1 = require("./dto/webhook-payload.dto");
let WebhookProcessorService = WebhookProcessorService_1 = class WebhookProcessorService {
    constructor(prisma, medicineResolver) {
        this.prisma = prisma;
        this.medicineResolver = medicineResolver;
        this.logger = new common_1.Logger(WebhookProcessorService_1.name);
    }
    async processWebhook(pharmacyId, payload, logId) {
        try {
            for (const medicine of payload.medicines) {
                await this.processMedicine(pharmacyId, payload.event_type, medicine);
            }
            await this.prisma.webhookLog.update({
                where: { id: logId },
                data: { status: 'processed', processedAt: new Date() },
            });
        }
        catch (error) {
            this.logger.error(`Failed to process webhook #${logId}: ${error.message}`);
            await this.prisma.webhookLog.update({
                where: { id: logId },
                data: { status: 'failed', errorMsg: error.message },
            });
            throw error;
        }
    }
    async processMedicine(pharmacyId, eventType, medicine) {
        const masterMedicineId = await this.medicineResolver.resolveOrCreate(medicine, pharmacyId);
        const quantityDelta = this.calculateQuantityDelta(eventType, medicine);
        await this.upsertStock(pharmacyId, masterMedicineId, medicine, quantityDelta, eventType);
        this.logger.log(`[${eventType}] Pharmacy#${pharmacyId} | Medicine#${masterMedicineId} | Δ${quantityDelta > 0 ? '+' : ''}${quantityDelta}`);
    }
    calculateQuantityDelta(eventType, medicine) {
        const qty = Math.abs(medicine.quantity_affected);
        switch (eventType) {
            case webhook_payload_dto_1.WebhookEventType.SALE:
                return -qty;
            case webhook_payload_dto_1.WebhookEventType.STOCK_ADDED:
                return +qty;
            case webhook_payload_dto_1.WebhookEventType.STOCK_REMOVED:
                return -qty;
            case webhook_payload_dto_1.WebhookEventType.RETURN:
                return +qty;
            case webhook_payload_dto_1.WebhookEventType.SHORTAGE:
                return 0;
            case webhook_payload_dto_1.WebhookEventType.STOCK_UPDATE:
                return medicine.current_quantity ?? 0;
            default:
                return 0;
        }
    }
    async upsertStock(pharmacyId, masterMedicineId, medicine, quantityDelta, eventType) {
        const existing = await this.prisma.pharmacyStock.findUnique({
            where: { pharmacyId_masterMedicineId: { pharmacyId, masterMedicineId } },
        });
        const isAbsoluteUpdate = eventType === webhook_payload_dto_1.WebhookEventType.STOCK_UPDATE;
        const newQuantity = isAbsoluteUpdate
            ? quantityDelta
            : Math.max(0, (existing?.quantity ?? 0) + quantityDelta);
        await this.prisma.pharmacyStock.upsert({
            where: { pharmacyId_masterMedicineId: { pharmacyId, masterMedicineId } },
            create: {
                pharmacyId,
                masterMedicineId,
                quantity: newQuantity,
                price: medicine.price ?? null,
                expiryDate: medicine.expiry_date ? new Date(medicine.expiry_date) : null,
                unit: medicine.unit ?? null,
                tabletsPerBox: medicine.tablets_per_box ?? null,
                localMedicineId: medicine.local_medicine_id,
                lastSyncAt: new Date(),
            },
            update: {
                quantity: newQuantity,
                price: medicine.price ?? undefined,
                expiryDate: medicine.expiry_date ? new Date(medicine.expiry_date) : undefined,
                unit: medicine.unit ?? undefined,
                tabletsPerBox: medicine.tablets_per_box ?? undefined,
                lastSyncAt: new Date(),
            },
        });
    }
};
exports.WebhookProcessorService = WebhookProcessorService;
exports.WebhookProcessorService = WebhookProcessorService = WebhookProcessorService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        medicine_resolver_service_1.MedicineResolverService])
], WebhookProcessorService);
//# sourceMappingURL=webhook-processor.service.js.map