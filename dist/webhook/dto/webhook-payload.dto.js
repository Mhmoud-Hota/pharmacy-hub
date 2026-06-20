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
exports.WebhookPayloadDto = exports.MedicinePayloadDto = exports.WebhookEventType = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
var WebhookEventType;
(function (WebhookEventType) {
    WebhookEventType["SALE"] = "sale";
    WebhookEventType["STOCK_ADDED"] = "stock_added";
    WebhookEventType["STOCK_REMOVED"] = "stock_removed";
    WebhookEventType["SHORTAGE"] = "shortage";
    WebhookEventType["RETURN"] = "return";
    WebhookEventType["STOCK_UPDATE"] = "stock_update";
})(WebhookEventType || (exports.WebhookEventType = WebhookEventType = {}));
class MedicinePayloadDto {
}
exports.MedicinePayloadDto = MedicinePayloadDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'الباركود - المعرّف الموحّد', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MedicinePayloadDto.prototype, "barcode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'اسم الدواء في هذه الصيدلية' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MedicinePayloadDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MedicinePayloadDto.prototype, "trad_name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MedicinePayloadDto.prototype, "scientific_name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'id الدواء في قاعدة بيانات الصيدلية' }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], MedicinePayloadDto.prototype, "local_medicine_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'الكمية المتأثرة في هذا الحدث' }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], MedicinePayloadDto.prototype, "quantity_affected", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'الكمية الإجمالية الحالية في الصيدلية', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], MedicinePayloadDto.prototype, "current_quantity", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], MedicinePayloadDto.prototype, "price", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MedicinePayloadDto.prototype, "unit", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], MedicinePayloadDto.prototype, "tablets_per_box", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MedicinePayloadDto.prototype, "expiry_date", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MedicinePayloadDto.prototype, "category", void 0);
class WebhookPayloadDto {
}
exports.WebhookPayloadDto = WebhookPayloadDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: WebhookEventType }),
    (0, class_validator_1.IsEnum)(WebhookEventType),
    __metadata("design:type", String)
], WebhookPayloadDto.prototype, "event_type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'timestamp الحدث' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], WebhookPayloadDto.prototype, "timestamp", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'الأدوية المتأثرة بهذا الحدث', type: [MedicinePayloadDto] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => MedicinePayloadDto),
    __metadata("design:type", Array)
], WebhookPayloadDto.prototype, "medicines", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'id الفاتورة أو العملية إن وُجدت', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], WebhookPayloadDto.prototype, "reference_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'بيانات إضافية اختيارية', required: false }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], WebhookPayloadDto.prototype, "metadata", void 0);
//# sourceMappingURL=webhook-payload.dto.js.map