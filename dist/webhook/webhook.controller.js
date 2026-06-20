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
var WebhookController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const crypto = require("crypto");
const prisma_service_1 = require("../database/prisma.service");
const webhook_processor_service_1 = require("./webhook-processor.service");
const webhook_payload_dto_1 = require("./dto/webhook-payload.dto");
let WebhookController = WebhookController_1 = class WebhookController {
    constructor(prisma, processor) {
        this.prisma = prisma;
        this.processor = processor;
        this.logger = new common_1.Logger(WebhookController_1.name);
    }
    async receiveWebhook(pharmacySlug, apiKey, signature, idempotencyKey, payload) {
        const pharmacy = await this.prisma.pharmacy.findFirst({
            where: { slug: pharmacySlug, isActive: true },
        });
        if (!pharmacy) {
            throw new common_1.BadRequestException(`Pharmacy "${pharmacySlug}" not found or inactive`);
        }
        if (pharmacy.apiKey !== apiKey) {
            this.logger.warn(`Invalid API key attempt for pharmacy: ${pharmacySlug}`);
            throw new common_1.UnauthorizedException('Invalid API key');
        }
        if (false && signature) {
            const isValid = this.verifySignature(JSON.stringify(payload), signature, pharmacy.webhookSecret);
            if (!isValid) {
                throw new common_1.UnauthorizedException('Invalid webhook signature');
            }
        }
        if (idempotencyKey) {
            const existing = await this.prisma.webhookLog.findFirst({
                where: { idempotencyKey },
                select: { id: true, status: true },
            });
            if (existing) {
                this.logger.log(`[Idempotency] Duplicate key="${idempotencyKey}" → 409 (logId=${existing.id})`);
                throw new common_1.ConflictException({
                    success: false,
                    duplicate: true,
                    message: 'هذا الحدث تم استقباله مسبقاً',
                    original_log_id: existing.id,
                    original_status: existing.status,
                });
            }
        }
        const log = await this.prisma.webhookLog.create({
            data: {
                pharmacyId: pharmacy.id,
                eventType: payload.event_type,
                rawPayload: payload,
                status: 'pending',
                idempotencyKey: idempotencyKey ?? null,
            },
        });
        this.logger.log(`[Webhook] Pharmacy: ${pharmacySlug} | Event: ${payload.event_type} | Medicines: ${payload.medicines.length}`);
        setImmediate(() => {
            this.processor
                .processWebhook(pharmacy.id, payload, log.id)
                .catch(err => this.logger.error(`Background processing failed: ${err.message}`));
        });
        return {
            success: true,
            message: 'Webhook received and queued for processing',
            log_id: log.id,
        };
    }
    verifySignature(payload, signature, secret) {
        const expected = crypto
            .createHmac('sha256', secret)
            .update(payload)
            .digest('hex');
        try {
            return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
        }
        catch {
            return false;
        }
    }
};
exports.WebhookController = WebhookController;
__decorate([
    (0, common_1.Post)(':pharmacySlug'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'استقبال حدث من صيدلية' }),
    (0, swagger_1.ApiParam)({ name: 'pharmacySlug', description: 'معرّف الصيدلية مثل: pharmacy-cairo-1' }),
    (0, swagger_1.ApiHeader)({ name: 'X-Pharmacy-Api-Key', required: true }),
    (0, swagger_1.ApiHeader)({ name: 'X-Webhook-Signature', required: false }),
    (0, swagger_1.ApiHeader)({ name: 'X-Idempotency-Key', required: false }),
    __param(0, (0, common_1.Param)('pharmacySlug')),
    __param(1, (0, common_1.Headers)('x-pharmacy-api-key')),
    __param(2, (0, common_1.Headers)('x-webhook-signature')),
    __param(3, (0, common_1.Headers)('x-idempotency-key')),
    __param(4, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, webhook_payload_dto_1.WebhookPayloadDto]),
    __metadata("design:returntype", Promise)
], WebhookController.prototype, "receiveWebhook", null);
exports.WebhookController = WebhookController = WebhookController_1 = __decorate([
    (0, swagger_1.ApiTags)('Webhooks'),
    (0, common_1.Controller)('webhooks'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        webhook_processor_service_1.WebhookProcessorService])
], WebhookController);
//# sourceMappingURL=webhook.controller.js.map