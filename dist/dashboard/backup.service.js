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
exports.BackupService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../database/prisma.service");
let BackupService = class BackupService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async fullBackup() {
        const [pharmacies, medicines, stocks, aliases] = await Promise.all([
            this.prisma.pharmacy.findMany(),
            this.prisma.masterMedicine.findMany(),
            this.prisma.pharmacyStock.findMany({
                include: {
                    pharmacy: { select: { slug: true } },
                    masterMedicine: { select: { barcode: true, canonicalName: true } },
                },
            }),
            this.prisma.medicineAlias.findMany(),
        ]);
        return {
            meta: {
                version: '1.0',
                type: 'full',
                exportedAt: new Date().toISOString(),
                counts: {
                    pharmacies: pharmacies.length,
                    medicines: medicines.length,
                    stocks: stocks.length,
                    aliases: aliases.length,
                },
            },
            data: { pharmacies, medicines, stocks, aliases },
        };
    }
    async pharmacyBackup(pharmacyId) {
        const pharmacy = await this.prisma.pharmacy.findUnique({ where: { id: pharmacyId } });
        if (!pharmacy)
            throw new common_1.NotFoundException('الصيدلية غير موجودة');
        const stocks = await this.prisma.pharmacyStock.findMany({
            where: { pharmacyId },
            include: { masterMedicine: true },
        });
        return {
            meta: {
                version: '1.0',
                type: 'pharmacy',
                exportedAt: new Date().toISOString(),
                pharmacyId: pharmacy.id,
                pharmacyName: pharmacy.name,
                pharmacySlug: pharmacy.slug,
                stockCount: stocks.length,
                totalUnits: stocks.reduce((s, x) => s + x.quantity, 0),
            },
            data: {
                pharmacy,
                stocks: stocks.map(s => ({
                    localMedicineId: s.localMedicineId,
                    barcode: s.masterMedicine.barcode,
                    medicineName: s.masterMedicine.canonicalName,
                    quantity: s.quantity,
                    price: s.price,
                    unit: s.unit,
                    tabletsPerBox: s.tabletsPerBox,
                    expiryDate: s.expiryDate,
                    lastSyncAt: s.lastSyncAt,
                })),
            },
        };
    }
    async pharmacyBackupCsv(pharmacyId) {
        const pharmacy = await this.prisma.pharmacy.findUnique({ where: { id: pharmacyId } });
        if (!pharmacy)
            throw new common_1.NotFoundException('الصيدلية غير موجودة');
        const stocks = await this.prisma.pharmacyStock.findMany({
            where: { pharmacyId },
            include: { masterMedicine: true },
        });
        const header = 'barcode,canonical_name,scientific_name,category,quantity,price,unit,tablets_per_box,expiry_date,last_sync';
        const rows = stocks.map(s => [
            s.masterMedicine.barcode ?? '',
            `"${s.masterMedicine.canonicalName}"`,
            `"${s.masterMedicine.scientificName ?? ''}"`,
            `"${s.masterMedicine.category ?? ''}"`,
            s.quantity,
            s.price ?? '',
            s.unit ?? '',
            s.tabletsPerBox ?? '',
            s.expiryDate ? s.expiryDate.toISOString().split('T')[0] : '',
            s.lastSyncAt.toISOString(),
        ].join(','));
        return [header, ...rows].join('\n');
    }
    async clearPharmacyStock(pharmacyId) {
        const pharmacy = await this.prisma.pharmacy.findUnique({ where: { id: pharmacyId } });
        if (!pharmacy)
            throw new common_1.NotFoundException('الصيدلية غير موجودة');
        const result = await this.prisma.pharmacyStock.deleteMany({ where: { pharmacyId } });
        return { deleted: result.count };
    }
    async importFromCsv(pharmacyId, csvContent, mode = 'merge') {
        const pharmacy = await this.prisma.pharmacy.findUnique({ where: { id: pharmacyId } });
        if (!pharmacy)
            throw new common_1.NotFoundException('الصيدلية غير موجودة');
        const lines = csvContent.trim().split('\n');
        if (lines.length < 2)
            throw new common_1.BadRequestException('الملف فارغ أو لا يحتوي على بيانات');
        const header = lines[0].split(',').map(h => h.trim().toLowerCase());
        const idx = {
            barcode: header.indexOf('barcode'),
            name: header.indexOf('canonical_name'),
            quantity: header.indexOf('quantity'),
            price: header.indexOf('price'),
            unit: header.indexOf('unit'),
            tabletsPerBox: header.indexOf('tablets_per_box'),
            expiryDate: header.indexOf('expiry_date'),
        };
        if (idx.name === -1 || idx.quantity === -1) {
            throw new common_1.BadRequestException('الملف يجب أن يحتوي على أعمدة: canonical_name, quantity');
        }
        if (mode === 'replace') {
            await this.prisma.pharmacyStock.deleteMany({ where: { pharmacyId } });
        }
        let imported = 0;
        let skipped = 0;
        const errors = [];
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line)
                continue;
            const cols = this.parseCsvLine(line);
            try {
                const medicineName = cols[idx.name]?.replace(/^"|"$/g, '').trim();
                const quantity = parseInt(cols[idx.quantity]) || 0;
                const barcode = idx.barcode >= 0 ? cols[idx.barcode]?.trim() || null : null;
                const price = idx.price >= 0 && cols[idx.price] ? parseFloat(cols[idx.price]) : null;
                const unit = idx.unit >= 0 ? cols[idx.unit]?.trim() || null : null;
                const tabletsPerBox = idx.tabletsPerBox >= 0 && cols[idx.tabletsPerBox]
                    ? parseInt(cols[idx.tabletsPerBox]) : null;
                const expiryDate = idx.expiryDate >= 0 && cols[idx.expiryDate]
                    ? new Date(cols[idx.expiryDate]) : null;
                if (!medicineName) {
                    skipped++;
                    continue;
                }
                let medicine = await this.prisma.masterMedicine.findFirst({
                    where: {
                        OR: [
                            barcode ? { barcode } : { canonicalName: medicineName },
                            { canonicalName: medicineName },
                        ],
                    },
                });
                if (!medicine) {
                    medicine = await this.prisma.masterMedicine.create({
                        data: {
                            canonicalName: medicineName,
                            barcode: barcode || undefined,
                            unit: unit || undefined,
                            tabletsPerBox: tabletsPerBox || undefined,
                        },
                    });
                }
                await this.prisma.pharmacyStock.upsert({
                    where: {
                        pharmacyId_masterMedicineId: {
                            pharmacyId,
                            masterMedicineId: medicine.id,
                        },
                    },
                    create: {
                        pharmacyId,
                        masterMedicineId: medicine.id,
                        quantity,
                        price: price !== null ? price : undefined,
                        unit: unit || undefined,
                        tabletsPerBox: tabletsPerBox || undefined,
                        expiryDate: expiryDate || undefined,
                    },
                    update: {
                        quantity,
                        price: price !== null ? price : undefined,
                        unit: unit || undefined,
                        tabletsPerBox: tabletsPerBox || undefined,
                        expiryDate: expiryDate || undefined,
                        lastSyncAt: new Date(),
                    },
                });
                imported++;
            }
            catch (e) {
                errors.push(`سطر ${i + 1}: ${e.message}`);
                skipped++;
            }
        }
        return { imported, skipped, errors };
    }
    async importFromJson(pharmacyId, json, mode = 'merge') {
        const pharmacy = await this.prisma.pharmacy.findUnique({ where: { id: pharmacyId } });
        if (!pharmacy)
            throw new common_1.NotFoundException('الصيدلية غير موجودة');
        const stocks = json?.data?.stocks ?? json?.stocks;
        if (!Array.isArray(stocks))
            throw new common_1.BadRequestException('صيغة الملف غير صحيحة');
        if (mode === 'replace') {
            await this.prisma.pharmacyStock.deleteMany({ where: { pharmacyId } });
        }
        let imported = 0, skipped = 0;
        for (const row of stocks) {
            try {
                const medicineName = row.medicineName ?? row.canonical_name;
                const barcode = row.barcode || null;
                if (!medicineName) {
                    skipped++;
                    continue;
                }
                let medicine = await this.prisma.masterMedicine.findFirst({
                    where: {
                        OR: [
                            barcode ? { barcode } : { canonicalName: medicineName },
                            { canonicalName: medicineName },
                        ],
                    },
                });
                if (!medicine) {
                    medicine = await this.prisma.masterMedicine.create({
                        data: {
                            canonicalName: medicineName,
                            barcode: barcode || undefined,
                            unit: row.unit || undefined,
                            tabletsPerBox: row.tabletsPerBox || undefined,
                        },
                    });
                }
                await this.prisma.pharmacyStock.upsert({
                    where: {
                        pharmacyId_masterMedicineId: { pharmacyId, masterMedicineId: medicine.id },
                    },
                    create: {
                        pharmacyId,
                        masterMedicineId: medicine.id,
                        quantity: row.quantity ?? 0,
                        price: row.price ?? undefined,
                        unit: row.unit || undefined,
                        tabletsPerBox: row.tabletsPerBox || undefined,
                        expiryDate: row.expiryDate ? new Date(row.expiryDate) : undefined,
                    },
                    update: {
                        quantity: row.quantity ?? 0,
                        price: row.price ?? undefined,
                        unit: row.unit || undefined,
                        tabletsPerBox: row.tabletsPerBox || undefined,
                        expiryDate: row.expiryDate ? new Date(row.expiryDate) : undefined,
                        lastSyncAt: new Date(),
                    },
                });
                imported++;
            }
            catch {
                skipped++;
            }
        }
        return { imported, skipped };
    }
    async getSearchStats(days = 30) {
        const since = new Date(Date.now() - days * 86400000);
        const topSearched = await this.prisma.masterMedicine.findMany({
            orderBy: { updatedAt: 'desc' },
            take: 20,
            include: {
                stocks: {
                    select: { quantity: true, price: true, pharmacy: { select: { name: true } } },
                },
                nameAliases: { select: { aliasName: true } },
            },
        });
        const byCategory = await this.prisma.masterMedicine.groupBy({
            by: ['category'],
            _count: { id: true },
            orderBy: { _count: { id: 'desc' } },
        });
        const activePharmacies = await this.prisma.webhookLog.groupBy({
            by: ['pharmacyId'],
            where: { createdAt: { gte: since } },
            _count: { id: true },
            orderBy: { _count: { id: 'desc' } },
            take: 10,
        });
        const pharmacyIds = activePharmacies.map(p => p.pharmacyId);
        const pharmacies = await this.prisma.pharmacy.findMany({
            where: { id: { in: pharmacyIds } },
            select: { id: true, name: true },
        });
        const phMap = Object.fromEntries(pharmacies.map(p => [p.id, p.name]));
        const [totalSearchable, zeroStock, multiPharmacy] = await Promise.all([
            this.prisma.masterMedicine.count(),
            this.prisma.masterMedicine.count({
                where: { stocks: { every: { quantity: { lte: 0 } } } },
            }),
            this.prisma.masterMedicine.count({
                where: { stocks: { some: { quantity: { gt: 0 } } } },
            }),
        ]);
        const logs = await this.prisma.webhookLog.findMany({
            where: { createdAt: { gte: since } },
            select: { createdAt: true, eventType: true, status: true },
        });
        const dailyActivity = {};
        for (const log of logs) {
            const day = log.createdAt.toISOString().split('T')[0];
            dailyActivity[day] = (dailyActivity[day] ?? 0) + 1;
        }
        const eventTypes = {};
        for (const log of logs) {
            eventTypes[log.eventType] = (eventTypes[log.eventType] ?? 0) + 1;
        }
        return {
            period: { days, since: since.toISOString() },
            summary: {
                total_medicines: totalSearchable,
                available_now: multiPharmacy,
                out_of_stock: zeroStock,
                total_events: logs.length,
            },
            top_medicines: topSearched.map(m => ({
                id: m.id,
                name: m.canonicalName,
                category: m.category,
                aliases_count: m.nameAliases.length,
                total_qty: m.stocks.reduce((s, x) => s + x.quantity, 0),
                pharmacy_count: m.stocks.filter(x => x.quantity > 0).length,
                avg_price: m.stocks.length
                    ? m.stocks.reduce((s, x) => s + Number(x.price ?? 0), 0) / m.stocks.length
                    : 0,
            })),
            by_category: byCategory.map(c => ({
                category: c.category ?? 'غير مصنف',
                count: c._count.id,
            })),
            active_pharmacies: activePharmacies.map(p => ({
                pharmacy_id: p.pharmacyId,
                pharmacy_name: phMap[p.pharmacyId] ?? `#${p.pharmacyId}`,
                event_count: p._count.id,
            })),
            daily_activity: Object.entries(dailyActivity)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([date, count]) => ({ date, count })),
            event_types: Object.entries(eventTypes)
                .sort(([, a], [, b]) => b - a)
                .map(([type, count]) => ({ type, count })),
        };
    }
    parseCsvLine(line) {
        const cols = [];
        let cur = '', inQuote = false;
        for (const ch of line) {
            if (ch === '"') {
                inQuote = !inQuote;
                cur += ch;
            }
            else if (ch === ',' && !inQuote) {
                cols.push(cur);
                cur = '';
            }
            else
                cur += ch;
        }
        cols.push(cur);
        return cols;
    }
};
exports.BackupService = BackupService;
exports.BackupService = BackupService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], BackupService);
//# sourceMappingURL=backup.service.js.map