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
var MedicineResolverService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MedicineResolverService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../database/prisma.service");
let MedicineResolverService = MedicineResolverService_1 = class MedicineResolverService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(MedicineResolverService_1.name);
    }
    async resolveOrCreate(medicine, pharmacyId) {
        if (medicine.barcode) {
            const byBarcode = await this.prisma.masterMedicine.findUnique({
                where: { barcode: medicine.barcode },
            });
            if (byBarcode) {
                this.logger.debug(`[Barcode Match] "${medicine.name}" → master #${byBarcode.id}`);
                await this.upsertAlias(byBarcode.id, medicine, pharmacyId);
                return byBarcode.id;
            }
        }
        const normalizedName = this.normalizeName(medicine.name);
        const byAlias = await this.prisma.medicineAlias.findFirst({
            where: {
                aliasName: { equals: normalizedName },
                OR: [{ pharmacyId }, { pharmacyId: null }],
            },
        });
        if (byAlias) {
            this.logger.debug(`[Alias Match] "${medicine.name}" → master #${byAlias.masterMedicineId}`);
            return byAlias.masterMedicineId;
        }
        if (medicine.trad_name) {
            const normalizedTrad = this.normalizeName(medicine.trad_name);
            const byTrad = await this.prisma.medicineAlias.findFirst({
                where: {
                    tradName: { equals: normalizedTrad },
                },
            });
            if (byTrad) {
                this.logger.debug(`[TradName Match] "${medicine.trad_name}" → master #${byTrad.masterMedicineId}`);
                await this.upsertAlias(byTrad.masterMedicineId, medicine, pharmacyId);
                return byTrad.masterMedicineId;
            }
        }
        this.logger.log(`[New Medicine] Creating master entry for "${medicine.name}"`);
        let newMaster;
        if (medicine.barcode) {
            newMaster = await this.prisma.masterMedicine.upsert({
                where: { barcode: medicine.barcode },
                create: {
                    barcode: medicine.barcode,
                    canonicalName: medicine.name,
                    scientificName: medicine.scientific_name ?? null,
                    category: medicine.category ?? null,
                    unit: medicine.unit ?? null,
                    tabletsPerBox: medicine.tablets_per_box ?? null,
                },
                update: {
                    canonicalName: medicine.name,
                    scientificName: medicine.scientific_name ?? undefined,
                    category: medicine.category ?? undefined,
                    unit: medicine.unit ?? undefined,
                    tabletsPerBox: medicine.tablets_per_box ?? undefined,
                },
            });
        }
        else {
            newMaster = await this.prisma.masterMedicine.create({
                data: {
                    barcode: null,
                    canonicalName: medicine.name,
                    scientificName: medicine.scientific_name ?? null,
                    category: medicine.category ?? null,
                    unit: medicine.unit ?? null,
                    tabletsPerBox: medicine.tablets_per_box ?? null,
                },
            });
        }
        await this.upsertAlias(newMaster.id, medicine, pharmacyId);
        return newMaster.id;
    }
    async upsertAlias(masterMedicineId, medicine, pharmacyId) {
        const normalizedName = this.normalizeName(medicine.name);
        await this.prisma.medicineAlias.upsert({
            where: {
                aliasName_pharmacyId: { aliasName: normalizedName, pharmacyId },
            },
            create: {
                masterMedicineId,
                aliasName: normalizedName,
                pharmacyId,
                localMedicineId: medicine.local_medicine_id,
                tradName: medicine.trad_name ?? null,
            },
            update: {
                localMedicineId: medicine.local_medicine_id,
                tradName: medicine.trad_name ?? null,
            },
        });
    }
    normalizeName(name) {
        return name
            .trim()
            .toLowerCase()
            .replace(/[\u064B-\u065F]/g, '')
            .replace(/\b\d+\s*(mg|ml|mcg|iu|g|kg)\b/gi, '')
            .replace(/\b(tab|cap|syrup|susp|inj|amp|vial|cream|gel|drops?)\b/gi, '')
            .replace(/\s+/g, ' ')
            .trim();
    }
};
exports.MedicineResolverService = MedicineResolverService;
exports.MedicineResolverService = MedicineResolverService = MedicineResolverService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MedicineResolverService);
//# sourceMappingURL=medicine-resolver.service.js.map