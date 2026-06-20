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
var BulkImportController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BulkImportController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const prisma_service_1 = require("../database/prisma.service");
const bulk_import_service_1 = require("./bulk-import.service");
const bulk_import_dto_1 = require("./dto/bulk-import.dto");
let BulkImportController = BulkImportController_1 = class BulkImportController {
    constructor(prisma, bulkImport) {
        this.prisma = prisma;
        this.bulkImport = bulkImport;
        this.logger = new common_1.Logger(BulkImportController_1.name);
    }
    async importStock(slug, apiKey, dto) {
        const pharmacy = await this.prisma.pharmacy.findFirst({
            where: { slug, isActive: true },
        });
        if (!pharmacy)
            throw new common_1.NotFoundException(`Pharmacy "${slug}" not found`);
        if (pharmacy.apiKey !== apiKey)
            throw new common_1.UnauthorizedException('Invalid API key');
        if (!dto.medicines?.length) {
            throw new common_1.BadRequestException('قائمة الأدوية فارغة');
        }
        this.logger.log(`[Import] ${pharmacy.name} → ${dto.medicines.length} medicines | replace=${dto.replace_existing}`);
        const result = await this.bulkImport.importPharmacyStock(pharmacy.id, dto);
        return {
            success: result.skipped < result.total,
            pharmacy: { id: pharmacy.id, name: pharmacy.name, slug: pharmacy.slug },
            summary: {
                total: result.total,
                processed: result.processed,
                created: result.created,
                updated: result.updated,
                skipped: result.skipped,
            },
            errors: result.errors.length > 0 ? result.errors : undefined,
            message: result.skipped === 0
                ? `تم استيراد ${result.total} دواء بنجاح`
                : `تم استيراد ${result.processed - result.skipped} من ${result.total}، فشل ${result.skipped}`,
        };
    }
};
exports.BulkImportController = BulkImportController;
__decorate([
    (0, common_1.Post)('import/:pharmacySlug'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'رفع المخزون الكامل لصيدلية (bulk import)',
        description: 'يُستخدم لرفع المخزون الأولي أو بعد جرد يدوي. ' +
            'replace_existing=true يمسح القديم ويعيد الاستيراد. ' +
            'replace_existing=false (افتراضي) يُحدّث أو يضيف فقط.',
    }),
    (0, swagger_1.ApiParam)({ name: 'pharmacySlug', example: 'pharmacy-cairo-1' }),
    (0, swagger_1.ApiHeader)({ name: 'X-Pharmacy-Api-Key', required: true }),
    __param(0, (0, common_1.Param)('pharmacySlug')),
    __param(1, (0, common_1.Headers)('x-pharmacy-api-key')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, bulk_import_dto_1.BulkImportDto]),
    __metadata("design:returntype", Promise)
], BulkImportController.prototype, "importStock", null);
exports.BulkImportController = BulkImportController = BulkImportController_1 = __decorate([
    (0, swagger_1.ApiTags)('Inventory'),
    (0, common_1.Controller)('inventory'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        bulk_import_service_1.BulkImportService])
], BulkImportController);
//# sourceMappingURL=bulk-import.controller.js.map