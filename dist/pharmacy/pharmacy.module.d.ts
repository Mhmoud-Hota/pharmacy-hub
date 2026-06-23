import { PrismaService } from '../database/prisma.service';
declare class CreatePharmacyDto {
    name: string;
    slug: string;
    address?: string;
    city?: string;
    phone?: string;
    workingHours?: string;
    latitude?: number;
    longitude?: number;
}
declare class UpdateLocationDto {
    latitude: number;
    longitude: number;
    address?: string;
    city?: string;
}
export declare class PharmacyController {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(dto: CreatePharmacyDto): Promise<{
        id: number;
        name: string;
        slug: string;
        location: {
            lat: number;
            lng: number;
        };
        api_key: string;
        webhook_secret: string;
        webhook_url: string;
        message: string;
    }>;
    updateLocation(slug: string, dto: UpdateLocationDto): Promise<{
        slug: string;
        location: {
            lat: number;
            lng: number;
        };
        address: string;
        city: string;
    }>;
    findAll(): Promise<{
        name: string;
        slug: string;
        address: string;
        city: string;
        phone: string;
        workingHours: string;
        latitude: number;
        longitude: number;
        id: number;
        isActive: boolean;
        createdAt: Date;
        _count: {
            stocks: number;
        };
    }[]>;
    getWebhookLogs(slug: string): Promise<{
        id: number;
        createdAt: Date;
        eventType: string;
        status: string;
        errorMsg: string;
        processedAt: Date;
    }[]>;
}
export declare class PharmacyModule {
}
export {};
