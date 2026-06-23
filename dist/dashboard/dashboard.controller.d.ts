import { DashboardService } from './dashboard.service';
export declare class DashboardController {
    private readonly svc;
    constructor(svc: DashboardService);
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
    getPharmacy(id: number): Promise<{
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
    createPharmacy(body: any): Promise<{
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
    updatePharmacy(id: number, body: any): Promise<{
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
    togglePharmacy(id: number, body: {
        active: boolean;
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
    regenerateKey(id: number): Promise<{
        apiKey: string;
    }>;
    getMedicines(page?: string, limit?: string, search?: string, category?: string): Promise<{
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
    getLogs(page?: string, pharmacyId?: string, status?: string): Promise<{
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
    getUsers(page?: string, limit?: string, search?: string, isVerified?: string): Promise<{
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
    createUser(body: {
        name: string;
        phone: string;
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
    updateUser(id: number, body: any): Promise<{
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
    sendOtpToUser(id: number): Promise<any>;
}
