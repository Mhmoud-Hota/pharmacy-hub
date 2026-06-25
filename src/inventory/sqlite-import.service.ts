// src/inventory/sqlite-import.service.ts
/**
 * SqliteImportService
 * ────────────────────
 * يقرأ ملف SQLite (medicore.db) الوارد كـ Buffer مباشرةً،
 * يسحب منه جدولَي medicines + batches،
 * ثم يحوّلهما إلى BulkImportDto ويمرّرهما لـ BulkImportService.
 *
 * يستخدم sql.js (pure JS, بدون native bindings) لضمان العمل على
 * Railway / Render / Koyeb بدون إعداد إضافي.
 *
 * منطق الكمية:
 *   نأخذ medicines.quantity (الرصيد الإجمالي في MEDICORE)
 *   فإذا كانت 0 أو null → نحسبها من مجموع batches.quantity
 *
 * منطق الانتهاء:
 *   من medicines.expiry_date أولاً، وإلا MIN(batches.expiry_date)
 */
import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { BulkImportDto, StockItemDto } from './dto/bulk-import.dto';
import { BulkImportService, ImportProgress } from './bulk-import.service';

// sql.js: pure-JS SQLite — يعمل من Buffer مباشرةً بدون native bindings
// eslint-disable-next-line @typescript-eslint/no-var-requires
const initSqlJs = require('sql.js');

// ── أشكال الصفوف كما تأتي من SQLite ───────────────────────────────────────
interface MedicineRow {
  id: number;
  name: string;
  trad_name: string | null;
  scientific_name: string | null;
  barcode: string | null;
  category: string | null;
  price: number | null;
  quantity: number;
  unit: string | null;
  tablets_per_box: number | null;
  expiry_date: string | null;
}

interface BatchSummary {
  total_qty: number;
  nearest_expiry: string | null;
}

@Injectable()
export class SqliteImportService {
  private readonly logger = new Logger(SqliteImportService.name);

  constructor(private readonly bulkImport: BulkImportService) {}

  /**
   * الدخول الرئيسي — يقبل Buffer مباشرةً من Multer
   */
  async importFromBuffer(
    pharmacyId: number,
    buffer: Buffer,
    replaceExisting: boolean,
  ): Promise<ImportProgress> {
    // ── 1. تهيئة sql.js وفتح القاعدة من Buffer ────────────────────────
    let SQL: any;
    try {
      SQL = await initSqlJs();
    } catch (e) {
      throw new BadRequestException(`فشل تهيئة محرك SQLite: ${e.message}`);
    }

    let db: any;
    try {
      db = new SQL.Database(new Uint8Array(buffer));
    } catch (e) {
      throw new BadRequestException(
        `فشل فتح ملف SQLite: ${e.message}. تأكد أن الملف صحيح (.db / .sqlite).`,
      );
    }

    try {
      // ── 2. تحقق من وجود جدول medicines ────────────────────────────────
      this.validateSchema(db);

      // ── 3. استخراج البيانات ────────────────────────────────────────────
      const medicines = this.fetchMedicines(db);
      const batchMap  = this.fetchBatchSummary(db);

      this.logger.log(
        `[SQLiteImport] Pharmacy#${pharmacyId} | ${medicines.length} medicines from buffer`,
      );

      // ── 4. تحويل إلى DTO ───────────────────────────────────────────────
      const items: StockItemDto[] = medicines.map(m => {
        const batch = batchMap.get(m.id);

        const quantity = (m.quantity != null && m.quantity > 0)
          ? m.quantity
          : (batch?.total_qty ?? 0);

        const expiryDate =
          m.expiry_date && m.expiry_date !== '0000-00-00' && m.expiry_date.trim() !== ''
            ? m.expiry_date
            : (batch?.nearest_expiry ?? undefined);

        return {
          local_medicine_id: m.id,
          name:              m.name,
          trad_name:         m.trad_name        ?? undefined,
          scientific_name:   m.scientific_name  ?? undefined,
          barcode:           m.barcode          ?? undefined,
          category:          m.category         ?? undefined,
          price:             m.price            ?? undefined,
          quantity,
          unit:              m.unit             ?? undefined,
          tablets_per_box:   m.tablets_per_box  ?? undefined,
          expiry_date:       expiryDate,
        } satisfies StockItemDto;
      });

      // ── 5. تشغيل الاستيراد ─────────────────────────────────────────────
      const dto: BulkImportDto = { medicines: items, replace_existing: replaceExisting };
      return this.bulkImport.importPharmacyStock(pharmacyId, dto);

    } finally {
      // ── 6. أغلق القاعدة دائماً ────────────────────────────────────────
      try { db.close(); } catch {}
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Helpers
  // ──────────────────────────────────────────────────────────────────────────

  /** يُنفّذ استعلاماً ويُعيد صفوفاً كـ array of objects */
  private query<T>(db: any, sql: string): T[] {
    const result = db.exec(sql);
    if (!result.length) return [];
    const { columns, values } = result[0];
    return values.map((row: any[]) => {
      const obj: any = {};
      columns.forEach((col: string, i: number) => { obj[col] = row[i]; });
      return obj as T;
    });
  }

  /** يتحقق من وجود جدول medicines */
  private validateSchema(db: any): void {
    const tables = this.query<{ name: string }>(
      db,
      `SELECT name FROM sqlite_master WHERE type='table'`,
    ).map(r => r.name);

    if (!tables.includes('medicines')) {
      throw new BadRequestException(
        `الملف لا يحتوي على جدول "medicines". الجداول الموجودة: ${tables.join(', ')}`,
      );
    }
  }

  /** يسحب الأدوية غير المحذوفة */
  private fetchMedicines(db: any): MedicineRow[] {
    return this.query<MedicineRow>(
      db,
      `SELECT id, name, trad_name, scientific_name, barcode, category,
              price, quantity, unit, tablets_per_box, expiry_date
       FROM   medicines
       WHERE  is_deleted = 0 OR is_deleted IS NULL`,
    );
  }

  /**
   * يُلخّص جدول batches لكل دواء:
   *   SUM(quantity) وأقرب expiry_date
   */
  private fetchBatchSummary(db: any): Map<number, BatchSummary> {
    // تحقق من وجود الجدول أولاً
    const has = db.exec(`SELECT name FROM sqlite_master WHERE type='table' AND name='batches'`);
    if (!has.length) return new Map();

    const rows = this.query<{ medicine_id: number; total_qty: number; nearest_expiry: string | null }>(
      db,
      `SELECT medicine_id,
              SUM(quantity)    AS total_qty,
              MIN(expiry_date) AS nearest_expiry
       FROM   batches
       WHERE  quantity > 0
       GROUP  BY medicine_id`,
    );

    return new Map(rows.map(r => [r.medicine_id, { total_qty: r.total_qty, nearest_expiry: r.nearest_expiry }]));
  }
}