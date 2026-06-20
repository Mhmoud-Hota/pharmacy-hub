// src/inventory/inventory.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

export interface StockFilters {
  pharmacyId?:  number;
  pharmacySlug?: string;
  barcode?:     string;
  medicineName?: string;
  category?:    string;
  lowStockThreshold?: number;
  page:         number;
  limit:        number;
}

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  // ─────────────────────────────────────────────────────────────────────────
  // 1. مخزون كل الصيدليات مجمّع (الصورة الكاملة)
  // ─────────────────────────────────────────────────────────────────────────
  async getAggregatedStock(filters: StockFilters) {
    const { page, limit } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filters.barcode)     where.barcode = { contains: filters.barcode };
    if (filters.category)    where.category = filters.category;
    if (filters.medicineName) {
      where.canonicalName = { contains: filters.medicineName};
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

    // شكّل الاستجابة بشكل واضح
    const data = medicines.map(med => ({
      id:             med.id,
      barcode:        med.barcode,
      canonical_name: med.canonicalName,
      scientific_name: med.scientificName,
      category:       med.category,
      unit:           med.unit,
      tablets_per_box: med.tabletsPerBox,
      total_quantity: med.stocks.reduce((sum, s) => sum + s.quantity, 0),
      available_in:   med.stocks.length,    // عدد الصيدليات التي لديها المخزون
      pharmacies:     med.stocks.map(s => ({
        pharmacy_id:   s.pharmacy.id,
        pharmacy_name: s.pharmacy.name,
        pharmacy_slug: s.pharmacy.slug,
        quantity:      s.quantity,
        price:         s.price,
        unit:          s.unit,
        expiry_date:   s.expiryDate,
        last_sync:     s.lastSyncAt,
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

  // ─────────────────────────────────────────────────────────────────────────
  // 2. مخزون صيدلية واحدة بعينها
  // ─────────────────────────────────────────────────────────────────────────
  async getPharmacyStock(pharmacyIdOrSlug: string | number, filters: StockFilters) {
    // إيجاد الصيدلية سواء بالـ id أو الـ slug
    const pharmacy = await this.prisma.pharmacy.findFirst({
      where: typeof pharmacyIdOrSlug === 'number'
        ? { id: pharmacyIdOrSlug }
        : { slug: pharmacyIdOrSlug as string },
    });

    if (!pharmacy) return null;

    const { page, limit } = filters;
    const skip = (page - 1) * limit;

    const stockWhere: any = { pharmacyId: pharmacy.id };
    if (filters.lowStockThreshold !== undefined) {
      stockWhere.quantity = { lte: filters.lowStockThreshold };
    }

    const masterWhere: any = {};
    if (filters.barcode)      masterWhere.barcode = { contains: filters.barcode };
    if (filters.category)     masterWhere.category = filters.category;
    if (filters.medicineName) {
      masterWhere.canonicalName = { contains: filters.medicineName};
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
        master_id:      s.masterMedicineId,
        barcode:        s.masterMedicine.barcode,
        canonical_name: s.masterMedicine.canonicalName,
        local_name:     s.masterMedicine.nameAliases[0]?.aliasName ?? s.masterMedicine.canonicalName,
        trad_name:      s.masterMedicine.nameAliases[0]?.tradName,
        scientific_name: s.masterMedicine.scientificName,
        category:       s.masterMedicine.category,
        quantity:       s.quantity,
        price:          s.price,
        unit:           s.unit,
        tablets_per_box: s.tabletsPerBox,
        expiry_date:    s.expiryDate,
        local_medicine_id: s.localMedicineId,
        last_sync:      s.lastSyncAt,
      })),
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 3. ملخص المخزون لكل الصيدليات
  // ─────────────────────────────────────────────────────────────────────────
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
      total_medicines:    totalMedicines,
      total_pharmacies:   pharmacies.length,
      low_stock_alerts:   lowStockCount,
      pharmacies_summary: pharmacies.map(p => ({
        id:              p.id,
        name:            p.name,
        slug:            p.slug,
        total_items:     p.stocks.length,
        total_units:     p.stocks.reduce((sum, s) => sum + s.quantity, 0),
      })),
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 4. البحث عن دواء عبر كل الصيدليات
  // ─────────────────────────────────────────────────────────────────────────
  async searchMedicine(query: string) {
    const normalized = query.trim().toLowerCase();

    const medicines = await this.prisma.masterMedicine.findMany({
      where: {
        OR: [
          { canonicalName: { contains: normalized} },
          { scientificName: { contains: normalized} },
          { barcode: { contains: normalized } },
          { nameAliases: { some: { aliasName: { contains: normalized} } } },
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
      id:             med.id,
      barcode:        med.barcode,
      canonical_name: med.canonicalName,
      scientific_name: med.scientificName,
      total_quantity: med.stocks.reduce((sum, s) => sum + s.quantity, 0),
      available_in:   med.stocks.map(s => ({
        pharmacy_name: s.pharmacy.name,
        pharmacy_slug: s.pharmacy.slug,
        quantity:      s.quantity,
        price:         s.price,
      })),
    }));
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 5. الأدوية التي كادت تنفد (low stock)
  // ─────────────────────────────────────────────────────────────────────────
  async getLowStock(threshold = 10, pharmacySlug?: string) {
    const where: any = { quantity: { lte: threshold } };

    if (pharmacySlug) {
      const pharmacy = await this.prisma.pharmacy.findUnique({ where: { slug: pharmacySlug } });
      if (pharmacy) where.pharmacyId = pharmacy.id;
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
      pharmacy:       s.pharmacy,
      medicine_name:  s.masterMedicine.canonicalName,
      barcode:        s.masterMedicine.barcode,
      category:       s.masterMedicine.category,
      quantity:       s.quantity,
      last_sync:      s.lastSyncAt,
    }));
  }
}
