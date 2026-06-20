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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventoryController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const inventory_service_1 = require("./inventory.service");
const geo_search_service_1 = require("./geo-search.service");
const search_medicine_dto_1 = require("./dto/search-medicine.dto");
let InventoryController = class InventoryController {
    constructor(inventoryService, geoSearchService) {
        this.inventoryService = inventoryService;
        this.geoSearchService = geoSearchService;
    }
    async findMedicine(query) {
        if (!query.q || query.q.trim().length < 2) {
            throw new common_1.BadRequestException('يجب إدخال اسم الدواء (حرفين على الأقل)');
        }
        const hasLat = query.lat !== undefined;
        const hasLng = query.lng !== undefined;
        if (hasLat !== hasLng) {
            throw new common_1.BadRequestException('يجب إرسال lat و lng معاً أو لا شيء');
        }
        const userLocation = hasLat && hasLng
            ? { latitude: query.lat, longitude: query.lng }
            : undefined;
        const results = await this.geoSearchService.searchMedicineNearby(query.q.trim(), userLocation, query.radius ?? 0, query.only_available ?? true);
        return {
            query: query.q,
            user_location: userLocation ?? null,
            radius_km: userLocation ? (query.radius ?? 0) : null,
            results_count: results.length,
            results,
        };
    }
    getSummary() { return this.inventoryService.getSummary(); }
    search(q) { return this.inventoryService.searchMedicine(q ?? ''); }
    getLowStock(threshold, pharmacySlug) {
        return this.inventoryService.getLowStock(threshold ? parseInt(threshold) : 10, pharmacySlug);
    }
    getAll(page = '1', limit = '50', barcode, medicineName, category) {
        return this.inventoryService.getAggregatedStock({
            page: parseInt(page), limit: parseInt(limit), barcode, medicineName, category,
        });
    }
    async getPharmacyStock(slug, page = '1', limit = '50', barcode, medicineName, category, lowStock) {
        const result = await this.inventoryService.getPharmacyStock(slug, {
            page: parseInt(page), limit: parseInt(limit),
            barcode, medicineName, category,
            lowStockThreshold: lowStock ? parseInt(lowStock) : undefined,
        });
        if (!result)
            throw new common_1.NotFoundException(`Pharmacy "${slug}" not found`);
        return result;
    }
};
exports.InventoryController = InventoryController;
__decorate([
    (0, common_1.Get)('find'),
    (0, swagger_1.ApiOperation)({
        summary: 'البحث عن دواء مع الترتيب بالمسافة',
        description: 'ابحث عن دواء في كل الصيدليات.' +
            ' أرسل lat/lng لترتيب النتائج من الأقرب للأبعد.' +
            ' استخدم radius لتحديد نطاق البحث (كيلومتر).',
    }),
    (0, swagger_1.ApiQuery)({ name: 'q', description: 'اسم الدواء أو الباركود', example: 'flutab' }),
    (0, swagger_1.ApiQuery)({ name: 'lat', description: 'خط العرض (latitude)', required: false, example: 30.0444 }),
    (0, swagger_1.ApiQuery)({ name: 'lng', description: 'خط الطول (longitude)', required: false, example: 31.2357 }),
    (0, swagger_1.ApiQuery)({ name: 'radius', description: 'نطاق البحث بالكيلومتر (0 = بلا حد)', required: false, example: 5 }),
    (0, swagger_1.ApiQuery)({ name: 'only_available', description: 'صيدليات متوفر فيها فقط', required: false }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [search_medicine_dto_1.SearchMedicineDto]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "findMedicine", null);
__decorate([
    (0, common_1.Get)('summary'),
    (0, swagger_1.ApiOperation)({ summary: 'ملخص المخزون لكل الصيدليات' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "getSummary", null);
__decorate([
    (0, common_1.Get)('search'),
    (0, swagger_1.ApiOperation)({ summary: 'بحث بسيط عن دواء (بدون إحداثيات)' }),
    (0, swagger_1.ApiQuery)({ name: 'q' }),
    __param(0, (0, common_1.Query)('q')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "search", null);
__decorate([
    (0, common_1.Get)('low-stock'),
    (0, swagger_1.ApiOperation)({ summary: 'الأدوية التي كادت تنفد' }),
    (0, swagger_1.ApiQuery)({ name: 'threshold', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'pharmacy', required: false }),
    __param(0, (0, common_1.Query)('threshold')),
    __param(1, (0, common_1.Query)('pharmacy')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "getLowStock", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'كل المخزون من كل الصيدليات مجمّعاً' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'barcode', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'name', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'category', required: false }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('barcode')),
    __param(3, (0, common_1.Query)('name')),
    __param(4, (0, common_1.Query)('category')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String, String]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "getAll", null);
__decorate([
    (0, common_1.Get)('pharmacy/:slug'),
    (0, swagger_1.ApiOperation)({ summary: 'مخزون صيدلية محددة' }),
    (0, swagger_1.ApiParam)({ name: 'slug' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'barcode', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'name', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'category', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'low_stock', required: false }),
    __param(0, (0, common_1.Param)('slug')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __param(3, (0, common_1.Query)('barcode')),
    __param(4, (0, common_1.Query)('name')),
    __param(5, (0, common_1.Query)('category')),
    __param(6, (0, common_1.Query)('low_stock')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object, String, String, String, String]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "getPharmacyStock", null);
exports.InventoryController = InventoryController = __decorate([
    (0, swagger_1.ApiTags)('Inventory'),
    (0, common_1.Controller)('inventory'),
    __metadata("design:paramtypes", [inventory_service_1.InventoryService,
        geo_search_service_1.GeoSearchService])
], InventoryController);
//# sourceMappingURL=inventory.controller.js.map