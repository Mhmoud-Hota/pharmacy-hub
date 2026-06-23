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
var ImageSearchController_1;
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImageSearchController = exports.ImageSearchDto = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const swagger_1 = require("@nestjs/swagger");
const geo_search_service_1 = require("./geo-search.service");
const image_search_service_1 = require("./image-search.service");
class ImageSearchDto {
}
exports.ImageSearchDto = ImageSearchDto;
let ImageSearchController = ImageSearchController_1 = class ImageSearchController {
    constructor(imageSearchService, geoSearchService) {
        this.imageSearchService = imageSearchService;
        this.geoSearchService = geoSearchService;
        this.logger = new common_1.Logger(ImageSearchController_1.name);
    }
    async searchByImage(file, body) {
        if (!file) {
            throw new common_1.BadRequestException('يجب إرسال صورة');
        }
        this.logger.log(`Image search: ${file.originalname} (${file.size} bytes)`);
        const extractionResult = await this.imageSearchService.extractMedicineFromImage(file.buffer, file.mimetype);
        if (!extractionResult.found || !extractionResult.medicineName) {
            return {
                success: false,
                message: extractionResult.message ?? 'لم يتم التعرف على اسم دواء في الصورة',
                extracted_names: [],
                results_count: 0,
                results: [],
            };
        }
        this.logger.log(`Extracted medicine name: "${extractionResult.medicineName}"`);
        const hasLat = body.lat !== undefined && body.lat !== '';
        const hasLng = body.lng !== undefined && body.lng !== '';
        const userLocation = hasLat && hasLng
            ? { latitude: parseFloat(body.lat), longitude: parseFloat(body.lng) }
            : undefined;
        const radius = body.radius ? parseFloat(body.radius) : 0;
        const results = await this.geoSearchService.searchMedicineNearby(extractionResult.medicineName, userLocation, radius, true);
        let finalResults = results;
        let usedName = extractionResult.medicineName;
        if (results.length === 0 && extractionResult.alternativeNames?.length) {
            for (const altName of extractionResult.alternativeNames) {
                const altResults = await this.geoSearchService.searchMedicineNearby(altName, userLocation, radius, true);
                if (altResults.length > 0) {
                    finalResults = altResults;
                    usedName = altName;
                    break;
                }
            }
        }
        return {
            success: true,
            extracted_name: extractionResult.medicineName,
            alternative_names: extractionResult.alternativeNames ?? [],
            searched_with: usedName,
            user_location: userLocation ?? null,
            radius_km: userLocation ? radius : null,
            results_count: finalResults.length,
            results: finalResults,
        };
    }
};
exports.ImageSearchController = ImageSearchController;
__decorate([
    (0, common_1.Post)('image-search'),
    (0, swagger_1.ApiOperation)({
        summary: 'البحث عن دواء عبر صورة (روشتة أو علبة دواء)',
        description: 'أرسل صورة روشتة أو علبة دواء. سيستخرج النظام اسم الدواء تلقائياً ويبحث عنه في المخزون.',
    }),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                image: { type: 'string', format: 'binary' },
                lat: { type: 'number', description: 'خط العرض (اختياري)' },
                lng: { type: 'number', description: 'خط الطول (اختياري)' },
                radius: { type: 'number', description: 'نطاق البحث بالكيلومتر (0 = بلا حد)' },
            },
            required: ['image'],
        },
    }),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('image', {
        limits: { fileSize: 10 * 1024 * 1024 },
        fileFilter: (req, file, cb) => {
            if (!file.mimetype.match(/^image\/(jpeg|png|webp|gif)$/)) {
                return cb(new common_1.BadRequestException('يُقبل فقط ملفات الصور (jpeg, png, webp)'), false);
            }
            cb(null, true);
        },
    })),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof Express !== "undefined" && (_a = Express.Multer) !== void 0 && _a.File) === "function" ? _b : Object, ImageSearchDto]),
    __metadata("design:returntype", Promise)
], ImageSearchController.prototype, "searchByImage", null);
exports.ImageSearchController = ImageSearchController = ImageSearchController_1 = __decorate([
    (0, swagger_1.ApiTags)('Inventory'),
    (0, common_1.Controller)('inventory'),
    __metadata("design:paramtypes", [image_search_service_1.ImageSearchService,
        geo_search_service_1.GeoSearchService])
], ImageSearchController);
//# sourceMappingURL=image-search.controller.js.map