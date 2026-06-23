import { PrismaService } from '../database/prisma.service';
export declare class DashboardService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getStats(): Promise<{
        pharmacies: {
            total: number;
            active: number;
        };
        medicines: {
            total: number;
        };
        stock: {
            total_units: number;
            low_stock: number;
        };
        webhooks_24h: number;
        top_medicines: {
            id: number;
            name: string;
            available_in: number;
            total_qty: number;
        }[];
    }>;
    getPharmacies(): Promise<({
        stocks: {
            quantity: number;
        }[];
        _count: {
            stocks: number;
            webhookLogs: number;
        };
    } & {
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
    })[]>;
    getPharmacyDetail(id: number): Promise<{
        stocks: ({
            masterMedicine: {
                id: number;
                createdAt: Date;
                updatedAt: Date;
                barcode: string | null;
                unit: string | null;
                category: string | null;
                canonicalName: string;
                scientificName: string | null;
                tabletsPerBox: number | null;
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
        webhookLogs: {
            id: number;
            createdAt: Date;
            eventType: string;
            status: string;
            errorMsg: string;
        }[];
    } & {
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
    }>;
    createPharmacy(data: {
        name: string;
        slug: string;
        address?: string;
        city?: string;
        phone?: string;
        workingHours?: string;
        latitude?: number;
        longitude?: number;
    }): Promise<{
        api_key: string;
        webhook_secret: string;
        webhook_url: string;
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
    }>;
    updatePharmacy(id: number, data: {
        name?: string;
        address?: string;
        city?: string;
        phone?: string;
        workingHours?: string;
        latitude?: number;
        longitude?: number;
        isActive?: boolean;
    }): Promise<{
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
    }>;
    togglePharmacy(id: number, active: boolean): Promise<{
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
    }>;
    regenerateApiKey(id: number): Promise<{
        apiKey: string;
    }>;
    getPharmacyStats(id: number): Promise<{
        total_items: number;
        total_units: number;
        low_stock: number;
        expiring_soon: number;
        recent_events: {
            createdAt: Date;
            eventType: string;
            status: string;
        }[];
    }>;
    getMedicines(page?: number, limit?: number, search?: string, category?: string): Promise<{
        data: {
            total_qty: number;
            available_in: number;
            stocks: ({
                pharmacy: {
                    name: string;
                    id: number;
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
        total: number;
        page: number;
        total_pages: number;
    }>;
    getWebhookLogs(page?: number, pharmacyId?: number, status?: string): Promise<{
        logs: ({
            pharmacy: {
                name: string;
                slug: string;
            };
        } & {
            id: number;
            createdAt: Date;
            pharmacyId: number;
            eventType: string;
            rawPayload: import("@prisma/client/runtime/library").JsonValue;
            status: string;
            errorMsg: string | null;
            processedAt: Date | null;
            idempotencyKey: string | null;
        })[];
        total: number;
        page: number;
    }>;
    getUsers(page?: number, limit?: number, search?: string, isVerified?: boolean): Promise<{
        data: {
            name: string;
            phone: string;
            id: number;
            createdAt: Date;
            updatedAt: Date;
            password: string;
            profileImage: string | null;
            isVerified: boolean;
            refreshToken: string | null;
        }[];
        total: number;
        page: number;
        total_pages: number;
        verified_count: number;
        unverified_count: number;
        new_today: number;
    }>;
    getUserById(id: number): Promise<{
        name: string;
        phone: string;
        id: number;
        createdAt: Date;
        updatedAt: Date;
        password: string;
        profileImage: string | null;
        isVerified: boolean;
        refreshToken: string | null;
    }>;
    createUser(data: {
        name: string;
        phone: string;
        isVerified?: boolean;
        password?: string;
    }): Promise<{
        name: string;
        phone: string;
        id: number;
        createdAt: Date;
        updatedAt: Date;
        password: string;
        profileImage: string | null;
        isVerified: boolean;
        refreshToken: string | null;
    }>;
    updateUser(id: number, data: {
        name?: string;
        phone?: string;
        isVerified?: boolean;
    }): Promise<{
        name: string;
        phone: string;
        id: number;
        createdAt: Date;
        updatedAt: Date;
        password: string;
        profileImage: string | null;
        isVerified: boolean;
        refreshToken: string | null;
    }>;
    deleteUser(id: number): Promise<{
        success: boolean;
    }>;
}
