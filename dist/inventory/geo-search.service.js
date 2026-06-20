"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeoSearchService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../database/prisma.service");
let GeoSearchService = class GeoSearchService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async searchMedicineNearby(query, userLoc, maxRadius = 0, onlyAvailable = true) {
        const medicines = await this.prisma.masterMedicine.findMany({
            where: {
                OR: [
                    { canonicalName: { contains: query } },
                    { scientificName: { contains: query } },
                    { barcode: { contains: query } },
                    {
                        nameAliases: {
                            some: { aliasName: { contains: query } },
                        },
                    },
                ],
            },
            include: {
                stocks: {
                    where: onlyAvailable ? { quantity: { gt: 0 } } : {},
                    include: {
                        pharmacy: true,
                    },
                },
            },
            take: 10,
        });
        return medicines.map(med => {
            let pharmacies = med.stocks.map(stock => {
                const distKm = (userLoc && stock.pharmacy.latitude && stock.pharmacy.longitude)
                    ? this.haversineKm(userLoc.latitude, userLoc.longitude, stock.pharmacy.latitude, stock.pharmacy.longitude)
                    : null;
                return {
                    pharmacy_id: stock.pharmacy.id,
                    pharmacy_name: stock.pharmacy.name,
                    pharmacy_slug: stock.pharmacy.slug,
                    address: stock.pharmacy.address,
                    city: stock.pharmacy.city,
                    phone: stock.pharmacy.phone,
                    working_hours: stock.pharmacy.workingHours,
                    quantity: stock.quantity,
                    price: stock.price,
                    unit: stock.unit,
                    expiry_date: stock.expiryDate,
                    last_sync: stock.lastSyncAt,
                    latitude: stock.pharmacy.latitude,
                    longitude: stock.pharmacy.longitude,
                    distance_km: distKm !== null ? Math.round(distKm * 10) / 10 : null,
                    has_location: !!(stock.pharmacy.latitude && stock.pharmacy.longitude),
                };
            });
            if (userLoc && maxRadius > 0) {
                pharmacies = pharmacies.filter(p => p.distance_km === null || p.distance_km <= maxRadius);
            }
            pharmacies.sort((a, b) => {
                if (a.distance_km !== null && b.distance_km !== null) {
                    return a.distance_km - b.distance_km;
                }
                if (a.distance_km !== null)
                    return -1;
                if (b.distance_km !== null)
                    return 1;
                return b.quantity - a.quantity;
            });
            return {
                medicine: {
                    id: med.id,
                    barcode: med.barcode,
                    canonical_name: med.canonicalName,
                    scientific_name: med.scientificName,
                    category: med.category,
                    unit: med.unit,
                },
                total_pharmacies_found: pharmacies.length,
                pharmacies,
            };
        });
    }
    haversineKm(lat1, lon1, lat2, lon2) {
        const R = 6371;
        const dLat = this.toRad(lat2 - lat1);
        const dLon = this.toRad(lon2 - lon1);
        const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(this.toRad(lat1)) *
                Math.cos(this.toRad(lat2)) *
                Math.sin(dLon / 2) ** 2;
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }
    toRad(deg) {
        return (deg * Math.PI) / 180;
    }
};
exports.GeoSearchService = GeoSearchService;
exports.GeoSearchService = GeoSearchService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], GeoSearchService);
//# sourceMappingURL=geo-search.service.js.map