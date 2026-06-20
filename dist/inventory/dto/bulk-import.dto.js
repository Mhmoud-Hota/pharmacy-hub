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
exports.BulkImportDto = exports.StockItemDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
class StockItemDto {
}
exports.StockItemDto = StockItemDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'الباركود — الأقوى للتعرف على الدواء', required: false, example: '6223001234567' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], StockItemDto.prototype, "barcode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'اسم الدواء كما هو في الصيدلية', example: 'فلوتاب 500' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], StockItemDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, example: 'Flutab' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], StockItemDto.prototype, "trad_name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, example: 'Paracetamol' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], StockItemDto.prototype, "scientific_name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'id الدواء في قاعدة بيانات الصيدلية المحلية', example: 42 }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], StockItemDto.prototype, "local_medicine_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'الكمية الحالية في المخزون', example: 120 }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], StockItemDto.prototype, "quantity", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, example: 15.5 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], StockItemDto.prototype, "price", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, example: 'علبة' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], StockItemDto.prototype, "unit", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, example: 20 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], StockItemDto.prototype, "tablets_per_box", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, example: '2026-12-01' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], StockItemDto.prototype, "expiry_date", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, example: 'مسكنات' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], StockItemDto.prototype, "category", void 0);
class BulkImportDto {
    constructor() {
        this.replace_existing = false;
    }
}
exports.BulkImportDto = BulkImportDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'قائمة كل أدوية الصيدلية',
        type: [StockItemDto],
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => StockItemDto),
    __metadata("design:type", Array)
], BulkImportDto.prototype, "medicines", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'هل تستبدل المخزون الموجود كاملاً؟ (true = امسح القديم أولاً)',
        required: false,
        default: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], BulkImportDto.prototype, "replace_existing", void 0);
//# sourceMappingURL=bulk-import.dto.js.map