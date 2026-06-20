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
exports.SearchMedicineDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
class SearchMedicineDto {
    constructor() {
        this.radius = 0;
        this.only_available = true;
    }
}
exports.SearchMedicineDto = SearchMedicineDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'اسم الدواء أو جزء منه أو الباركود — مثال: flutab أو فلوتاب',
        example: 'flutab',
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SearchMedicineDto.prototype, "q", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'خط العرض للمستخدم (latitude)',
        example: 30.0444,
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(-90),
    (0, class_validator_1.Max)(90),
    __metadata("design:type", Number)
], SearchMedicineDto.prototype, "lat", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'خط الطول للمستخدم (longitude)',
        example: 31.2357,
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(-180),
    (0, class_validator_1.Max)(180),
    __metadata("design:type", Number)
], SearchMedicineDto.prototype, "lng", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'نطاق البحث الجغرافي (كيلومتر) — 0 يعني بلا حد',
        example: 5,
        required: false,
        default: 0,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], SearchMedicineDto.prototype, "radius", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'أظهر فقط الصيدليات التي لديها الدواء متاح (quantity > 0)',
        required: false,
        default: true,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => value === 'false' ? false : true),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], SearchMedicineDto.prototype, "only_available", void 0);
//# sourceMappingURL=search-medicine.dto.js.map