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
        _count: {
            stocks: number;
            webhookLogs: number;
        };
        stocks: {
            quantity: number;
        }[];
    } & {
        name: string;
        phone: string | null;
        createdAt: Date;
        id: number;
        updatedAt: Date;
        slug: string;
        webhookSecret: string;
        apiKey: string;
        isActive: boolean;
        latitude: number | null;
        longitude: number | null;
        address: string | null;
        city: string | null;
        workingHours: string | null;
    })[]>;
    getPharmacy(id: number): Promise<{
        stocks: ({
            masterMedicine: {
                createdAt: Date;
                id: number;
                barcode: string | null;
                canonicalName: string;
                scientificName: string | null;
                category: string | null;
                unit: string | null;
                tabletsPerBox: number | null;
                updatedAt: Date;
            };
        } & {
            id: number;
            unit: string | null;
            tabletsPerBox: number | null;
            updatedAt: Date;
            pharmacyId: number;
            masterMedicineId: number;
            quantity: number;
            price: import("@prisma/client/runtime/library").Decimal | null;
            expiryDate: Date | null;
            localMedicineId: number | null;
            lastSyncAt: Date;
        })[];
        webhookLogs: {
            createdAt: Date;
            id: number;
            eventType: string;
            status: string;
            errorMsg: string;
        }[];
    } & {
        name: string;
        phone: string | null;
        createdAt: Date;
        id: number;
        updatedAt: Date;
        slug: string;
        webhookSecret: string;
        apiKey: string;
        isActive: boolean;
        latitude: number | null;
        longitude: number | null;
        address: string | null;
        city: string | null;
        workingHours: string | null;
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
        phone: string | null;
        createdAt: Date;
        id: number;
        updatedAt: Date;
        slug: string;
        webhookSecret: string;
        apiKey: string;
        isActive: boolean;
        latitude: number | null;
        longitude: number | null;
        address: string | null;
        city: string | null;
        workingHours: string | null;
    }>;
    updatePharmacy(id: number, body: any): Promise<{
        name: string;
        phone: string | null;
        createdAt: Date;
        id: number;
        updatedAt: Date;
        slug: string;
        webhookSecret: string;
        apiKey: string;
        isActive: boolean;
        latitude: number | null;
        longitude: number | null;
        address: string | null;
        city: string | null;
        workingHours: string | null;
    }>;
    togglePharmacy(id: number, body: {
        active: boolean;
    }): Promise<{
        name: string;
        phone: string | null;
        createdAt: Date;
        id: number;
        updatedAt: Date;
        slug: string;
        webhookSecret: string;
        apiKey: string;
        isActive: boolean;
        latitude: number | null;
        longitude: number | null;
        address: string | null;
        city: string | null;
        workingHours: string | null;
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
                unit: string | null;
                tabletsPerBox: number | null;
                updatedAt: Date;
                pharmacyId: number;
                masterMedicineId: number;
                quantity: number;
                price: import("@prisma/client/runtime/library").Decimal | null;
                expiryDate: Date | null;
                localMedicineId: number | null;
                lastSyncAt: Date;
            })[];
            createdAt: Date;
            id: number;
            barcode: string | null;
            canonicalName: string;
            scientificName: string | null;
            category: string | null;
            unit: string | null;
            tabletsPerBox: number | null;
            updatedAt: Date;
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
            createdAt: Date;
            id: number;
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
            password: string;
            profileImage: string | null;
            isVerified: boolean;
            createdAt: Date;
            id: number;
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
        password: string;
        profileImage: string | null;
        isVerified: boolean;
        createdAt: Date;
        id: number;
    }>;
    createUser(body: {
        name: string;
        phone: string;
        isVerified?: boolean;
    }): Promise<{
        name: string;
        phone: string;
        password: string;
        profileImage: string | null;
        isVerified: boolean;
        createdAt: Date;
        id: number;
    }>;
    updateUser(id: number, body: any): Promise<{
        name: string;
        phone: string;
        password: string;
        profileImage: string | null;
        isVerified: boolean;
        createdAt: Date;
        id: number;
    }>;
    deleteUser(id: number): Promise<{
        success: boolean;
    }>;
    sendOtpToUser(id: number): Promise<any>;
}
