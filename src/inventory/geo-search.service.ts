// src/inventory/geo-search.service.ts
/**
 * GeoSearchService
 * ────────────────
 * يبحث عن دواء في كل الصيدليات ويرتّب النتائج بحسب:
 *  1. توفر الدواء (quantity > 0)
 *  2. المسافة من موقع الباحث (الأقرب أولاً)
 *
 * حساب المسافة: Haversine Formula
 * (دقيقة للمسافات القصيرة حتى ~500km)
 */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

export interface UserLocation {
  latitude:  number;
  longitude: number;
}

export interface MedicineSearchResult {
  medicine: {
    id:             number;
    barcode:        string | null;
    canonical_name: string;
    scientific_name: string | null;
    category:       string | null;
    unit:           string | null;
  };
  total_pharmacies_found: number;
  pharmacies: PharmacyResult[];
}

export interface PharmacyResult {
  pharmacy_id:   number;
  pharmacy_name: string;
  pharmacy_slug: string;
  address:       string | null;
  city:          string | null;
  phone:         string | null;
  working_hours: string | null;
  quantity:      number;
  price:         any;
  unit:          string | null;
  expiry_date:   Date | null;
  last_sync:     Date;
  // موقع
  latitude:      number | null;
  longitude:     number | null;
  // مسافة (null إذا لم يُرسَل موقع الباحث)
  distance_km:   number | null;
  has_location:  boolean;
}

@Injectable()
export class GeoSearchService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * البحث الرئيسي: اسم الدواء + موقع الباحث (اختياري)
   *
   * @param query     نص البحث (اسم أو باركود أو اسم علمي)
   * @param userLoc   إحداثيات المستخدم (اختيارية)
   * @param maxRadius بحث فقط ضمن هذا النطاق بالكيلومتر (0 = بلا حد)
   * @param onlyAvailable  أظهر فقط الصيدليات التي لديها الدواء
   */
  async searchMedicineNearby(
    query: string,
    userLoc?: UserLocation,
    maxRadius = 0,
    onlyAvailable = true,
  ): Promise<MedicineSearchResult[]> {

    // ── 1. ابحث عن الأدوية المطابقة ─────────────────────────────────────
    const medicines = await this.prisma.masterMedicine.findMany({
      where: {
        OR: [
          { canonicalName:  { contains: query} },
          { scientificName: { contains: query} },
          { barcode:        { contains: query } },
          {
            nameAliases: {
              some: { aliasName: { contains: query} },
            },
          },
        ],
      },
      include: {
        stocks: {
          where: onlyAvailable ? { quantity: { gt: 0 } } : {},
          include: {
            pharmacy: true,   // نريد كل بيانات الصيدلية بما فيها الإحداثيات
          },
        },
      },
      take: 10,  // أقصى 10 أدوية مختلفة في النتيجة
    });

    // ── 2. لكل دواء: احسب المسافة ورتّب الصيدليات ──────────────────────
    return medicines.map(med => {
      let pharmacies: PharmacyResult[] = med.stocks.map(stock => {
        const distKm = (userLoc && stock.pharmacy.latitude && stock.pharmacy.longitude)
          ? this.haversineKm(
              userLoc.latitude,  userLoc.longitude,
              stock.pharmacy.latitude, stock.pharmacy.longitude,
            )
          : null;

        return {
          pharmacy_id:   stock.pharmacy.id,
          pharmacy_name: stock.pharmacy.name,
          pharmacy_slug: stock.pharmacy.slug,
          address:       stock.pharmacy.address,
          city:          stock.pharmacy.city,
          phone:         stock.pharmacy.phone,
          working_hours: stock.pharmacy.workingHours,
          quantity:      stock.quantity,
          price:         stock.price,
          unit:          stock.unit,
          expiry_date:   stock.expiryDate,
          last_sync:     stock.lastSyncAt,
          latitude:      stock.pharmacy.latitude,
          longitude:     stock.pharmacy.longitude,
          distance_km:   distKm !== null ? Math.round(distKm * 10) / 10 : null,
          has_location:  !!(stock.pharmacy.latitude && stock.pharmacy.longitude),
        };
      });

      // ── تصفية حسب نطاق المسافة (إذا طُلب) ─────────────────────────────
      if (userLoc && maxRadius > 0) {
        pharmacies = pharmacies.filter(p =>
          p.distance_km === null || p.distance_km <= maxRadius,
        );
      }

      // ── الترتيب: الصيدليات القريبة أولاً، ثم الأبعد، ثم بلا إحداثيات ──
      pharmacies.sort((a, b) => {
        if (a.distance_km !== null && b.distance_km !== null) {
          return a.distance_km - b.distance_km;   // الأقرب أولاً
        }
        if (a.distance_km !== null) return -1;    // بلا مسافة للآخر → يأتي لاحقاً
        if (b.distance_km !== null) return 1;
        return b.quantity - a.quantity;            // إذا لا أحداثيات → الأكثر كمية أولاً
      });

      return {
        medicine: {
          id:             med.id,
          barcode:        med.barcode,
          canonical_name: med.canonicalName,
          scientific_name: med.scientificName,
          category:       med.category,
          unit:           med.unit,
        },
        total_pharmacies_found: pharmacies.length,
        pharmacies,
      };
    });
  }

  /**
   * Haversine Formula
   * تحسب المسافة الكروية بين نقطتين على سطح الأرض (بالكيلومتر)
   */
  haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R    = 6371;                           // نصف قطر الأرض (km)
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a    =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(this.toRad(lat1)) *
      Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  private toRad(deg: number) {
    return (deg * Math.PI) / 180;
  }
}
