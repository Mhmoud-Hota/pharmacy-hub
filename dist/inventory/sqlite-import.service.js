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
var SqliteImportService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SqliteImportService = void 0;
const common_1 = require("@nestjs/common");
const bulk_import_service_1 = require("./bulk-import.service");
const initSqlJs = require('sql.js');
let SqliteImportService = SqliteImportService_1 = class SqliteImportService {
    constructor(bulkImport) {
        this.bulkImport = bulkImport;
        this.logger = new common_1.Logger(SqliteImportService_1.name);
    }
    async importFromBuffer(pharmacyId, buffer, replaceExisting) {
        let SQL;
        try {
            SQL = await initSqlJs();
        }
        catch (e) {
            throw new common_1.BadRequestException(`فشل تهيئة محرك SQLite: ${e.message}`);
        }
        let db;
        try {
            db = new SQL.Database(new Uint8Array(buffer));
        }
        catch (e) {
            throw new common_1.BadRequestException(`فشل فتح ملف SQLite: ${e.message}. تأكد أن الملف صحيح (.db / .sqlite).`);
        }
        try {
            this.validateSchema(db);
            const medicines = this.fetchMedicines(db);
            const batchMap = this.fetchBatchSummary(db);
            this.logger.log(`[SQLiteImport] Pharmacy#${pharmacyId} | ${medicines.length} medicines from buffer`);
            const items = medicines.map(m => {
                const batch = batchMap.get(m.id);
                const quantity = (m.quantity != null && m.quantity > 0)
                    ? m.quantity
                    : (batch?.total_qty ?? 0);
                const expiryDate = m.expiry_date && m.expiry_date !== '0000-00-00' && m.expiry_date.trim() !== ''
                    ? m.expiry_date
                    : (batch?.nearest_expiry ?? undefined);
                return {
                    local_medicine_id: m.id,
                    name: m.name,
                    trad_name: m.trad_name ?? undefined,
                    scientific_name: m.scientific_name ?? undefined,
                    barcode: m.barcode ?? undefined,
                    category: m.category ?? undefined,
                    price: m.price ?? undefined,
                    quantity,
                    unit: m.unit ?? undefined,
                    tablets_per_box: m.tablets_per_box ?? undefined,
                    expiry_date: expiryDate,
                };
            });
            const dto = { medicines: items, replace_existing: replaceExisting };
            return this.bulkImport.importPharmacyStock(pharmacyId, dto);
        }
        finally {
            try {
                db.close();
            }
            catch { }
        }
    }
    query(db, sql) {
        const result = db.exec(sql);
        if (!result.length)
            return [];
        const { columns, values } = result[0];
        return values.map((row) => {
            const obj = {};
            columns.forEach((col, i) => { obj[col] = row[i]; });
            return obj;
        });
    }
    validateSchema(db) {
        const tables = this.query(db, `SELECT name FROM sqlite_master WHERE type='table'`).map(r => r.name);
        if (!tables.includes('medicines')) {
            throw new common_1.BadRequestException(`الملف لا يحتوي على جدول "medicines". الجداول الموجودة: ${tables.join(', ')}`);
        }
    }
    fetchMedicines(db) {
        return this.query(db, `SELECT id, name, trad_name, scientific_name, barcode, category,
              price, quantity, unit, tablets_per_box, expiry_date
       FROM   medicines
       WHERE  is_deleted = 0 OR is_deleted IS NULL`);
    }
    fetchBatchSummary(db) {
        const has = db.exec(`SELECT name FROM sqlite_master WHERE type='table' AND name='batches'`);
        if (!has.length)
            return new Map();
        const rows = this.query(db, `SELECT medicine_id,
              SUM(quantity)    AS total_qty,
              MIN(expiry_date) AS nearest_expiry
       FROM   batches
       WHERE  quantity > 0
       GROUP  BY medicine_id`);
        return new Map(rows.map(r => [r.medicine_id, { total_qty: r.total_qty, nearest_expiry: r.nearest_expiry }]));
    }
};
exports.SqliteImportService = SqliteImportService;
exports.SqliteImportService = SqliteImportService = SqliteImportService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [bulk_import_service_1.BulkImportService])
], SqliteImportService);
//# sourceMappingURL=sqlite-import.service.js.map