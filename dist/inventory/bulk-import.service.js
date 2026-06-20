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
var BulkImportService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BulkImportService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../database/prisma.service");
const medicine_resolver_service_1 = require("../webhook/medicine-resolver.service");
let BulkImportService = BulkImportService_1 = class BulkImportService {
    constructor(prisma, medicineResolver) {
        this.prisma = prisma;
        this.medicineResolver = medicineResolver;
        this.logger = new common_1.Logger(BulkImportService_1.name);
        this.BATCH_SIZE = 50;
    }
    async importPharmacyStock(pharmacyId, dto) {
        const progress = {
            total: dto.medicines.length,
            processed: 0,
            created: 0,
            updated: 0,
            skipped: 0,
            errors: [],
        };
        this.logger.log(`[BulkImport] Pharmacy#${pharmacyId} | ${dto.medicines.length} medicines | replace=${dto.replace_existing}`);
        if (dto.replace_existing) {
            const deleted = await this.prisma.pharmacyStock.deleteMany({
                where: { pharmacyId },
            });
            this.logger.log(`[BulkImport] Cleared ${deleted.count} old stock entries`);
        }
        const batches = this.chunk(dto.medicines, this.BATCH_SIZE);
        for (const batch of batches) {
            await Promise.allSettled(batch.map(item => this.processOneItem(pharmacyId, item, progress)));
        }
        this.logger.log(`[BulkImport] Done | created=${progress.created} updated=${progress.updated} skipped=${progress.skipped}`);
        return progress;
    }
    async processOneItem(pharmacyId, item, progress) {
        try {
            const medicinePayload = {
                barcode: item.barcode,
                name: item.name,
                trad_name: item.trad_name,
                scientific_name: item.scientific_name,
                local_medicine_id: item.local_medicine_id,
                quantity_affected: item.quantity,
                current_quantity: item.quantity,
                price: item.price,
                unit: item.unit,
                tablets_per_box: item.tablets_per_box,
                expiry_date: item.expiry_date,
                category: item.category,
            };
            const masterMedicineId = await this.medicineResolver.resolveOrCreate(medicinePayload, pharmacyId);
            const existing = await this.prisma.pharmacyStock.findUnique({
                where: { pharmacyId_masterMedicineId: { pharmacyId, masterMedicineId } },
            });
            await this.prisma.pharmacyStock.upsert({
                where: { pharmacyId_masterMedicineId: { pharmacyId, masterMedicineId } },
                create: {
                    pharmacyId,
                    masterMedicineId,
                    quantity: item.quantity,
                    price: item.price ?? null,
                    expiryDate: item.expiry_date ? new Date(item.expiry_date) : null,
                    unit: item.unit ?? null,
                    tabletsPerBox: item.tablets_per_box ?? null,
                    localMedicineId: item.local_medicine_id,
                    lastSyncAt: new Date(),
                },
                update: {
                    quantity: item.quantity,
                    price: item.price ?? undefined,
                    expiryDate: item.expiry_date ? new Date(item.expiry_date) : undefined,
                    unit: item.unit ?? undefined,
                    tabletsPerBox: item.tablets_per_box ?? undefined,
                    localMedicineId: item.local_medicine_id,
                    lastSyncAt: new Date(),
                },
            });
            existing ? progress.updated++ : progress.created++;
            progress.processed++;
        }
        catch (err) {
            progress.skipped++;
            progress.processed++;
            progress.errors.push(`[${item.name}] ${err.message}`);
            this.logger.warn(`[BulkImport] Skipped "${item.name}": ${err.message}`);
        }
    }
    chunk(arr, size) {
        const out = [];
        for (let i = 0; i < arr.length; i += size)
            out.push(arr.slice(i, i + size));
        return out;
    }
};
exports.BulkImportService = BulkImportService;
exports.BulkImportService = BulkImportService = BulkImportService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        medicine_resolver_service_1.MedicineResolverService])
], BulkImportService);
//# sourceMappingURL=bulk-import.service.js.map