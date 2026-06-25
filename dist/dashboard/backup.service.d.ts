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
                id: number;
                name: string;
                slug: string;
                webhookSecret: string;
                apiKey: string;
                isActive: boolean;
                latitude: number | null;
                longitude: number | null;
                address: string | null;
                city: string | null;
                phone: string | null;
                workingHours: string | null;
                createdAt: Date;
                updatedAt: Date;
            }[];
            medicines: {
                id: number;
                createdAt: Date;
                updatedAt: Date;
                barcode: string | null;
                canonicalName: string;
                scientificName: string | null;
                category: string | null;
                unit: string | null;
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
                unit: string | null;
                tabletsPerBox: number | null;
                pharmacyId: number;
                masterMedicineId: number;
                quantity: number;
                price: import("@prisma/client/runtime/library").Decimal | null;
                expiryDate: Date | null;
                localMedicineId: number | null;
                lastSyncAt: Date;
            })[];
            aliases: {
                id: number;
                createdAt: Date;
                pharmacyId: number | null;
                masterMedicineId: number;
                localMedicineId: number | null;
                aliasName: string;
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
                id: number;
                name: string;
                slug: string;
                webhookSecret: string;
                apiKey: string;
                isActive: boolean;
                latitude: number | null;
                longitude: number | null;
                address: string | null;
                city: string | null;
                phone: string | null;
                workingHours: string | null;
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
    private parseCsvLine;
}
