import { PrismaService } from '../database/prisma.service';
export interface StockFilters {
    pharmacyId?: number;
    pharmacySlug?: string;
    barcode?: string;
    medicineName?: string;
    category?: string;
    lowStockThreshold?: number;
    page: number;
    limit: number;
}
export declare class InventoryService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getAggregatedStock(filters: StockFilters): Promise<{
        data: {
            id: number;
            barcode: string;
            canonical_name: string;
            scientific_name: string;
            category: string;
            unit: string;
            tablets_per_box: number;
            total_quantity: number;
            available_in: number;
            pharmacies: {
                pharmacy_id: number;
                pharmacy_name: string;
                pharmacy_slug: string;
                quantity: number;
                price: import("@prisma/client/runtime/library").Decimal;
                unit: string;
                expiry_date: Date;
                last_sync: Date;
            }[];
        }[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            total_pages: number;
        };
    }>;
    getPharmacyStock(pharmacyIdOrSlug: string | number, filters: StockFilters): Promise<{
        pharmacy: {
            id: number;
            name: string;
            slug: string;
        };
        data: {
            master_id: number;
            barcode: string;
            canonical_name: string;
            local_name: string;
            trad_name: string;
            scientific_name: string;
            category: string;
            quantity: number;
            price: import("@prisma/client/runtime/library").Decimal;
            unit: string;
            tablets_per_box: number;
            expiry_date: Date;
            local_medicine_id: number;
            last_sync: Date;
        }[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            total_pages: number;
        };
    }>;
    getSummary(): Promise<{
        total_medicines: number;
        total_pharmacies: number;
        low_stock_alerts: number;
        pharmacies_summary: {
            id: number;
            name: string;
            slug: string;
            total_items: number;
            total_units: number;
        }[];
    }>;
    searchMedicine(query: string): Promise<{
        id: number;
        barcode: string;
        canonical_name: string;
        scientific_name: string;
        total_quantity: number;
        available_in: {
            pharmacy_name: string;
            pharmacy_slug: string;
            quantity: number;
            price: import("@prisma/client/runtime/library").Decimal;
        }[];
    }[]>;
    getLowStock(threshold?: number, pharmacySlug?: string): Promise<{
        pharmacy: {
            name: string;
            slug: string;
            id: number;
        };
        medicine_name: string;
        barcode: string;
        category: string;
        quantity: number;
        last_sync: Date;
    }[]>;
}
