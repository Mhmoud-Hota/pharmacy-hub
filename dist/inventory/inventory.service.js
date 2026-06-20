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
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventoryService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../database/prisma.service");
let InventoryService = class InventoryService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getAggregatedStock(filters) {
        const { page, limit } = filters;
        const skip = (page - 1) * limit;
        const where = {};
        if (filters.barcode)
            where.barcode = { contains: filters.barcode };
        if (filters.category)
            where.category = filters.category;
        if (filters.medicineName) {
            where.canonicalName = { contains: filters.medicineName };
        }
        const [medicines, total] = await Promise.all([
            this.prisma.masterMedicine.findMany({
                where,
                skip,
                take: limit,
                include: {
                    stocks: {
                        include: { pharmacy: { select: { id: true, name: true, slug: true } } },
                        orderBy: { quantity: 'desc' },
                    },
                },
                orderBy: { canonicalName: 'asc' },
            }),
            this.prisma.masterMedicine.count({ where }),
        ]);
        const data = medicines.map(med => ({
            id: med.id,
            barcode: med.barcode,
            canonical_name: med.canonicalName,
            scientific_name: med.scientificName,
            category: med.category,
            unit: med.unit,
            tablets_per_box: med.tabletsPerBox,
            total_quantity: med.stocks.reduce((sum, s) => sum + s.quantity, 0),
            available_in: med.stocks.length,
            pharmacies: med.stocks.map(s => ({
                pharmacy_id: s.pharmacy.id,
                pharmacy_name: s.pharmacy.name,
                pharmacy_slug: s.pharmacy.slug,
                quantity: s.quantity,
                price: s.price,
                unit: s.unit,
                expiry_date: s.expiryDate,
                last_sync: s.lastSyncAt,
            })),
        }));
        return {
            data,
            pagination: {
                page,
                limit,
                total,
                total_pages: Math.ceil(total / limit),
            },
        };
    }
    async getPharmacyStock(pharmacyIdOrSlug, filters) {
        const pharmacy = await this.prisma.pharmacy.findFirst({
            where: typeof pharmacyIdOrSlug === 'number'
                ? { id: pharmacyIdOrSlug }
                : { slug: pharmacyIdOrSlug },
        });
        if (!pharmacy)
            return null;
        const { page, limit } = filters;
        const skip = (page - 1) * limit;
        const stockWhere = { pharmacyId: pharmacy.id };
        if (filters.lowStockThreshold !== undefined) {
            stockWhere.quantity = { lte: filters.lowStockThreshold };
        }
        const masterWhere = {};
        if (filters.barcode)
            masterWhere.barcode = { contains: filters.barcode };
        if (filters.category)
            masterWhere.category = filters.category;
        if (filters.medicineName) {
            masterWhere.canonicalName = { contains: filters.medicineName };
        }
        const [stocks, total] = await Promise.all([
            this.prisma.pharmacyStock.findMany({
                where: {
                    ...stockWhere,
                    masterMedicine: { ...masterWhere },
                },
                skip,
                take: limit,
                include: {
                    masterMedicine: {
                        include: {
                            nameAliases: {
                                where: { pharmacyId: pharmacy.id },
                                select: { aliasName: true, tradName: true },
                            },
                        },
                    },
                },
                orderBy: { masterMedicine: { canonicalName: 'asc' } },
            }),
            this.prisma.pharmacyStock.count({
                where: {
                    ...stockWhere,
                    masterMedicine: { ...masterWhere },
                },
            }),
        ]);
        return {
            pharmacy: { id: pharmacy.id, name: pharmacy.name, slug: pharmacy.slug },
            data: stocks.map(s => ({
                master_id: s.masterMedicineId,
                barcode: s.masterMedicine.barcode,
                canonical_name: s.masterMedicine.canonicalName,
                local_name: s.masterMedicine.nameAliases[0]?.aliasName ?? s.masterMedicine.canonicalName,
                trad_name: s.masterMedicine.nameAliases[0]?.tradName,
                scientific_name: s.masterMedicine.scientificName,
                category: s.masterMedicine.category,
                quantity: s.quantity,
                price: s.price,
                unit: s.unit,
                tablets_per_box: s.tabletsPerBox,
                expiry_date: s.expiryDate,
                local_medicine_id: s.localMedicineId,
                last_sync: s.lastSyncAt,
            })),
            pagination: {
                page,
                limit,
                total,
                total_pages: Math.ceil(total / limit),
            },
        };
    }
    async getSummary() {
        const [pharmacies, totalMedicines, lowStockCount] = await Promise.all([
            this.prisma.pharmacy.findMany({
                where: { isActive: true },
                include: {
                    stocks: {
                        select: { quantity: true },
                    },
                },
            }),
            this.prisma.masterMedicine.count(),
            this.prisma.pharmacyStock.count({ where: { quantity: { lte: 5 } } }),
        ]);
        return {
            total_medicines: totalMedicines,
            total_pharmacies: pharmacies.length,
            low_stock_alerts: lowStockCount,
            pharmacies_summary: pharmacies.map(p => ({
                id: p.id,
                name: p.name,
                slug: p.slug,
                total_items: p.stocks.length,
                total_units: p.stocks.reduce((sum, s) => sum + s.quantity, 0),
            })),
        };
    }
    async searchMedicine(query) {
        const normalized = query.trim().toLowerCase();
        const medicines = await this.prisma.masterMedicine.findMany({
            where: {
                OR: [
                    { canonicalName: { contains: normalized } },
                    { scientificName: { contains: normalized } },
                    { barcode: { contains: normalized } },
                    { nameAliases: { some: { aliasName: { contains: normalized } } } },
                ],
            },
            include: {
                stocks: {
                    where: { quantity: { gt: 0 } },
                    include: { pharmacy: { select: { id: true, name: true, slug: true } } },
                    orderBy: { quantity: 'desc' },
                },
            },
            take: 20,
        });
        return medicines.map(med => ({
            id: med.id,
            barcode: med.barcode,
            canonical_name: med.canonicalName,
            scientific_name: med.scientificName,
            total_quantity: med.stocks.reduce((sum, s) => sum + s.quantity, 0),
            available_in: med.stocks.map(s => ({
                pharmacy_name: s.pharmacy.name,
                pharmacy_slug: s.pharmacy.slug,
                quantity: s.quantity,
                price: s.price,
            })),
        }));
    }
    async getLowStock(threshold = 10, pharmacySlug) {
        const where = { quantity: { lte: threshold } };
        if (pharmacySlug) {
            const pharmacy = await this.prisma.pharmacy.findUnique({ where: { slug: pharmacySlug } });
            if (pharmacy)
                where.pharmacyId = pharmacy.id;
        }
        const stocks = await this.prisma.pharmacyStock.findMany({
            where,
            include: {
                pharmacy: { select: { id: true, name: true, slug: true } },
                masterMedicine: { select: { canonicalName: true, barcode: true, category: true } },
            },
            orderBy: { quantity: 'asc' },
            take: 100,
        });
        return stocks.map(s => ({
            pharmacy: s.pharmacy,
            medicine_name: s.masterMedicine.canonicalName,
            barcode: s.masterMedicine.barcode,
            category: s.masterMedicine.category,
            quantity: s.quantity,
            last_sync: s.lastSyncAt,
        }));
    }
};
exports.InventoryService = InventoryService;
exports.InventoryService = InventoryService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], InventoryService);
//# sourceMappingURL=inventory.service.js.map