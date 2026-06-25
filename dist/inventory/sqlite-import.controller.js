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
var SqliteImportController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SqliteImportController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const swagger_1 = require("@nestjs/swagger");
const prisma_service_1 = require("../database/prisma.service");
const sqlite_import_service_1 = require("./sqlite-import.service");
let SqliteImportController = SqliteImportController_1 = class SqliteImportController {
    constructor(prisma, sqliteImport) {
        this.prisma = prisma;
        this.sqliteImport = sqliteImport;
        this.logger = new common_1.Logger(SqliteImportController_1.name);
    }
    async importFromSqlite(slug, apiKey, file, replaceStr) {
        const pharmacy = await this.prisma.pharmacy.findFirst({
            where: { slug, isActive: true },
        });
        if (!pharmacy)
            throw new common_1.NotFoundException(`Pharmacy "${slug}" not found`);
        if (pharmacy.apiKey !== apiKey)
            throw new common_1.UnauthorizedException('Invalid API key');
        if (!file) {
            throw new common_1.BadRequestException('لم يُرفق أي ملف. أرسل ملف .db في حقل "file".');
        }
        if (!file.originalname.match(/\.(db|sqlite|sqlite3)$/i)) {
            throw new common_1.BadRequestException(`امتداد الملف "${file.originalname}" غير مدعوم. المدعومة: .db .sqlite .sqlite3`);
        }
        const replaceExisting = replaceStr === 'true';
        this.logger.log(`[SQLiteImport] ${pharmacy.name} | file=${file.originalname} ` +
            `size=${(file.size / 1024).toFixed(1)}KB | replace=${replaceExisting}`);
        const result = await this.sqliteImport.importFromBuffer(pharmacy.id, file.buffer, replaceExisting);
        return {
            success: result.skipped < result.total,
            pharmacy: { id: pharmacy.id, name: pharmacy.name, slug: pharmacy.slug },
            file: { name: file.originalname, size_kb: +(file.size / 1024).toFixed(1) },
            summary: {
                total: result.total,
                processed: result.processed,
                created: result.created,
                updated: result.updated,
                skipped: result.skipped,
            },
            errors: result.errors.length > 0 ? result.errors : undefined,
            message: result.skipped === 0
                ? `تم استيراد ${result.total} دواء من الملف بنجاح`
                : `تم استيراد ${result.processed - result.skipped} من ${result.total}، فشل ${result.skipped}`,
        };
    }
};
exports.SqliteImportController = SqliteImportController;
__decorate([
    (0, common_1.Post)('import-sqlite/:pharmacySlug'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiOperation)({
        summary: 'استيراد المخزون من ملف SQLite (medicore.db)',
        description: 'ارفع ملف .db الخاص بـ MEDICORE مباشرةً. ' +
            'سيُستخرج منه جدول medicines وbatches تلقائياً. ' +
            'replace_existing=true يمسح المخزون القديم قبل الاستيراد.',
    }),
    (0, swagger_1.ApiParam)({ name: 'pharmacySlug', example: 'alandalos' }),
    (0, swagger_1.ApiHeader)({ name: 'X-Pharmacy-Api-Key', required: true }),
    (0, swagger_1.ApiQuery)({
        name: 'replace_existing',
        required: false,
        type: Boolean,
        example: false,
        description: 'true → امسح المخزون الحالي وأعد الاستيراد كاملاً',
    }),
    (0, swagger_1.ApiBody)({
        description: 'ملف SQLite (.db)',
        schema: {
            type: 'object',
            properties: {
                file: { type: 'string', format: 'binary' },
            },
        },
    }),
    __param(0, (0, common_1.Param)('pharmacySlug')),
    __param(1, (0, common_1.Headers)('x-pharmacy-api-key')),
    __param(2, (0, common_1.UploadedFile)()),
    __param(3, (0, common_1.Query)('replace_existing')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, String]),
    __metadata("design:returntype", Promise)
], SqliteImportController.prototype, "importFromSqlite", null);
exports.SqliteImportController = SqliteImportController = SqliteImportController_1 = __decorate([
    (0, swagger_1.ApiTags)('Inventory'),
    (0, common_1.Controller)('inventory'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        sqlite_import_service_1.SqliteImportService])
], SqliteImportController);
//# sourceMappingURL=sqlite-import.controller.js.map