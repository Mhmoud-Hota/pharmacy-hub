import { PrismaService } from '../database/prisma.service';
export interface UserLocation {
    latitude: number;
    longitude: number;
}
export interface MedicineSearchResult {
    medicine: {
        id: number;
        barcode: string | null;
        canonical_name: string;
        scientific_name: string | null;
        category: string | null;
        unit: string | null;
    };
    total_pharmacies_found: number;
    pharmacies: PharmacyResult[];
}
export interface PharmacyResult {
    pharmacy_id: number;
    pharmacy_name: string;
    pharmacy_slug: string;
    address: string | null;
    city: string | null;
    phone: string | null;
    working_hours: string | null;
    quantity: number;
    price: any;
    unit: string | null;
    expiry_date: Date | null;
    last_sync: Date;
    latitude: number | null;
    longitude: number | null;
    distance_km: number | null;
    has_location: boolean;
}
export declare class GeoSearchService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    searchMedicineNearby(query: string, userLoc?: UserLocation, maxRadius?: number, onlyAvailable?: boolean): Promise<MedicineSearchResult[]>;
    haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number;
    private toRad;
}
