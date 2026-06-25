import { PrismaService } from '../database/prisma.service';
export declare class BackupService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    fullBackup(): Promise<{
        meta: {
            version: string;
            type: string;
            exportedAt: string;
            counts: {
                pharmacies: number;
                medicines: number;
                stocks: number;
                aliases: number;
            };
        };
        data: {
            pharmacies: {
                name: string;
                slug: string;
                address: string | null;
                city: string | null;
                phone: string | null;
                workingHours: string | null;
                latitude: number | null;
                longitude: number | null;
                id: number;
                apiKey: string;
                webhookSecret: string;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
            }[];
            medicines: {
                id: number;
                createdAt: Date;
                updatedAt: Date;
                barcode: string | null;
                unit: string | null;
                category: string | null;
                canonicalName: string;
                scientificName: string | null;
                tabletsPerBox: number | null;
            }[];
            stocks: ({
                pharmacy: {
                    slug: string;
                };
                masterMedicine: {
                    barcode: string;
                    canonicalName: string;
                };
            } & {
                id: number;
                updatedAt: Date;
                pharmacyId: number;
                price: import("@prisma/client/runtime/library").Decimal | null;
                unit: string | null;
                tabletsPerBox: number | null;
                masterMedicineId: number;
                localMedicineId: number | null;
                quantity: number;
                expiryDate: Date | null;
                lastSyncAt: Date;
            })[];
            aliases: {
                id: number;
                createdAt: Date;
                pharmacyId: number | null;
                masterMedicineId: number;
                aliasName: string;
                localMedicineId: number | null;
                tradName: string | null;
            }[];
        };
    }>;
    pharmacyBackup(pharmacyId: number): Promise<{
        meta: {
            version: string;
            type: string;
            exportedAt: string;
            pharmacyId: number;
            pharmacyName: string;
            pharmacySlug: string;
            stockCount: number;
            totalUnits: number;
        };
        data: {
            pharmacy: {
                name: string;
                slug: string;
                address: string | null;
                city: string | null;
                phone: string | null;
                workingHours: string | null;
                latitude: number | null;
                longitude: number | null;
                id: number;
                apiKey: string;
                webhookSecret: string;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
            };
            stocks: {
                localMedicineId: number;
                barcode: string;
                medicineName: string;
                quantity: number;
                price: import("@prisma/client/runtime/library").Decimal;
                unit: string;
                tabletsPerBox: number;
                expiryDate: Date;
                lastSyncAt: Date;
            }[];
        };
    }>;
    pharmacyBackupCsv(pharmacyId: number): Promise<string>;
    clearPharmacyStock(pharmacyId: number): Promise<{
        deleted: number;
    }>;
    importFromCsv(pharmacyId: number, csvContent: string, mode?: 'merge' | 'replace'): Promise<{
        imported: number;
        skipped: number;
        errors: string[];
    }>;
    importFromJson(pharmacyId: number, json: any, mode?: 'merge' | 'replace'): Promise<{
        imported: number;
        skipped: number;
    }>;
    getSearchStats(days?: number): Promise<{
        period: {
            days: number;
            since: string;
        };
        summary: {
            total_medicines: number;
            available_now: number;
            out_of_stock: number;
            total_events: number;
        };
        top_medicines: {
            id: number;
            name: string;
            category: string;
            aliases_count: number;
            total_qty: number;
            pharmacy_count: number;
            avg_price: number;
        }[];
        by_category: {
            category: string;
            count: number;
        }[];
        active_pharmacies: {
            pharmacy_id: number;
            pharmacy_name: string;
            event_count: number;
        }[];
        daily_activity: {
            date: string;
            count: number;
        }[];
        event_types: {
            type: string;
            count: number;
        }[];
    }>;
    importFromSql(pharmacyId: number, sqlContent: string, mode?: 'merge' | 'replace'): Promise<{
        imported: number;
        skipped: number;
        errors: string[];
        detected_rows: number;
    }>;
    private parseSqlMedicines;
    private splitSqlRows;
    private parseSqlRow;
    private parseCsvLine;
    private sqlValue;
}
