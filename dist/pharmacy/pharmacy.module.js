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
exports.PharmacyModule = exports.PharmacyController = void 0;
const common_1 = require("@nestjs/common");
const common_2 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const crypto = require("crypto");
const prisma_service_1 = require("../database/prisma.service");
class CreatePharmacyDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePharmacyDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePharmacyDto.prototype, "slug", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePharmacyDto.prototype, "address", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePharmacyDto.prototype, "city", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePharmacyDto.prototype, "phone", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePharmacyDto.prototype, "workingHours", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(-90),
    (0, class_validator_1.Max)(90),
    __metadata("design:type", Number)
], CreatePharmacyDto.prototype, "latitude", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(-180),
    (0, class_validator_1.Max)(180),
    __metadata("design:type", Number)
], CreatePharmacyDto.prototype, "longitude", void 0);
class UpdateLocationDto {
}
__decorate([
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(-90),
    (0, class_validator_1.Max)(90),
    __metadata("design:type", Number)
], UpdateLocationDto.prototype, "latitude", void 0);
__decorate([
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(-180),
    (0, class_validator_1.Max)(180),
    __metadata("design:type", Number)
], UpdateLocationDto.prototype, "longitude", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateLocationDto.prototype, "address", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateLocationDto.prototype, "city", void 0);
let PharmacyController = class PharmacyController {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto) {
        const exists = await this.prisma.pharmacy.findUnique({ where: { slug: dto.slug } });
        if (exists)
            throw new common_2.ConflictException(`Slug "${dto.slug}" already taken`);
        const apiKey = crypto.randomBytes(32).toString('hex');
        const webhookSecret = crypto.randomBytes(32).toString('hex');
        const pharmacy = await this.prisma.pharmacy.create({
            data: {
                name: dto.name,
                slug: dto.slug,
                apiKey,
                webhookSecret,
                address: dto.address ?? null,
                city: dto.city ?? null,
                phone: dto.phone ?? null,
                workingHours: dto.workingHours ?? null,
                latitude: dto.latitude ?? null,
                longitude: dto.longitude ?? null,
            },
        });
        return {
            id: pharmacy.id,
            name: pharmacy.name,
            slug: pharmacy.slug,
            location: pharmacy.latitude ? { lat: pharmacy.latitude, lng: pharmacy.longitude } : null,
            api_key: apiKey,
            webhook_secret: webhookSecret,
            webhook_url: `/webhooks/${pharmacy.slug}`,
            message: 'احتفظ بهذه المفاتيح في مكان آمن - لن تُعرض مجدداً',
        };
    }
    async updateLocation(slug, dto) {
        const pharmacy = await this.prisma.pharmacy.findUnique({ where: { slug } });
        if (!pharmacy)
            throw new common_2.NotFoundException(`Pharmacy "${slug}" not found`);
        const updated = await this.prisma.pharmacy.update({
            where: { slug },
            data: {
                latitude: dto.latitude,
                longitude: dto.longitude,
                address: dto.address ?? pharmacy.address,
                city: dto.city ?? pharmacy.city,
            },
        });
        return {
            slug: updated.slug,
            location: { lat: updated.latitude, lng: updated.longitude },
            address: updated.address,
            city: updated.city,
        };
    }
    async findAll() {
        return this.prisma.pharmacy.findMany({
            select: {
                id: true, name: true, slug: true, isActive: true,
                address: true, city: true, phone: true, workingHours: true,
                latitude: true, longitude: true,
                createdAt: true,
                _count: { select: { stocks: true } },
            },
            orderBy: { name: 'asc' },
        });
    }
    async getWebhookLogs(slug) {
        const pharmacy = await this.prisma.pharmacy.findUnique({ where: { slug } });
        if (!pharmacy)
            throw new common_2.NotFoundException();
        return this.prisma.webhookLog.findMany({
            where: { pharmacyId: pharmacy.id },
            orderBy: { createdAt: 'desc' },
            take: 100,
            select: {
                id: true, eventType: true, status: true,
                errorMsg: true, processedAt: true, createdAt: true,
            },
        });
    }
};
exports.PharmacyController = PharmacyController;
__decorate([
    (0, common_2.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'تسجيل صيدلية جديدة' }),
    __param(0, (0, common_2.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CreatePharmacyDto]),
    __metadata("design:returntype", Promise)
], PharmacyController.prototype, "create", null);
__decorate([
    (0, common_2.Patch)(':slug/location'),
    (0, swagger_1.ApiOperation)({ summary: 'تحديث الموقع الجغرافي للصيدلية' }),
    (0, swagger_1.ApiParam)({ name: 'slug' }),
    __param(0, (0, common_2.Param)('slug')),
    __param(1, (0, common_2.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, UpdateLocationDto]),
    __metadata("design:returntype", Promise)
], PharmacyController.prototype, "updateLocation", null);
__decorate([
    (0, common_2.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'قائمة كل الصيدليات' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PharmacyController.prototype, "findAll", null);
__decorate([
    (0, common_2.Get)(':slug/webhook-logs'),
    (0, swagger_1.ApiOperation)({ summary: 'سجلات الـ webhooks لصيدلية' }),
    __param(0, (0, common_2.Param)('slug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PharmacyController.prototype, "getWebhookLogs", null);
exports.PharmacyController = PharmacyController = __decorate([
    (0, swagger_1.ApiTags)('Pharmacies'),
    (0, common_2.Controller)('pharmacies'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PharmacyController);
let PharmacyModule = class PharmacyModule {
};
exports.PharmacyModule = PharmacyModule;
exports.PharmacyModule = PharmacyModule = __decorate([
    (0, common_1.Module)({
        controllers: [PharmacyController],
    })
], PharmacyModule);
//# sourceMappingURL=pharmacy.module.js.map