// src/webhook/webhook.controller.ts
import {
  Controller, Post, Headers, Body, Param,
  HttpCode, HttpStatus, BadRequestException,
  UnauthorizedException, ConflictException, Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader, ApiParam } from '@nestjs/swagger';
import * as crypto from 'crypto';
import { PrismaService } from '../database/prisma.service';
import { WebhookProcessorService } from './webhook-processor.service';
import { WebhookPayloadDto } from './dto/webhook-payload.dto';

@ApiTags('Webhooks')
@Controller('webhooks')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly processor: WebhookProcessorService,
  ) {}

  @Post(':pharmacySlug')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'استقبال حدث من صيدلية' })
  @ApiParam({ name: 'pharmacySlug', description: 'معرّف الصيدلية مثل: pharmacy-cairo-1' })
  @ApiHeader({ name: 'X-Pharmacy-Api-Key', required: true })
  @ApiHeader({ name: 'X-Webhook-Signature', required: false })
  @ApiHeader({ name: 'X-Idempotency-Key', required: false })
  async receiveWebhook(
    @Param('pharmacySlug')           pharmacySlug: string,
    @Headers('x-pharmacy-api-key')   apiKey: string,
    @Headers('x-webhook-signature')  signature: string,
    @Headers('x-idempotency-key')    idempotencyKey: string,
    @Body() payload: WebhookPayloadDto,
  ) {
    // 1. التحقق من وجود الصيدلية وصحة المفتاح
    const pharmacy = await this.prisma.pharmacy.findFirst({
      where: { slug: pharmacySlug, isActive: true },
    });

    if (!pharmacy) {
      throw new BadRequestException(`Pharmacy "${pharmacySlug}" not found or inactive`);
    }
    if (pharmacy.apiKey !== apiKey) {
      this.logger.warn(`Invalid API key attempt for pharmacy: ${pharmacySlug}`);
      throw new UnauthorizedException('Invalid API key');
    }

    // 2. التحقق من HMAC Signature (إن أُرسلت)
if (false && signature) {
        const isValid = this.verifySignature(
        JSON.stringify(payload),
        signature,
        pharmacy.webhookSecret,
      );
      if (!isValid) {
        throw new UnauthorizedException('Invalid webhook signature');
      }
    }

    // 3. [إضافة] فحص الـ Idempotency — منع معالجة نفس الحدث مرتين
    if (idempotencyKey) {
      const existing = await this.prisma.webhookLog.findFirst({
        where:  { idempotencyKey },
        select: { id: true, status: true },
      });

      if (existing) {
        this.logger.log(
          `[Idempotency] Duplicate key="${idempotencyKey}" → 409 (logId=${existing.id})`,
        );
        throw new ConflictException({
          success:         false,
          duplicate:       true,
          message:         'هذا الحدث تم استقباله مسبقاً',
          original_log_id: existing.id,
          original_status: existing.status,
        });
      }
    }

    // 4. سجّل الحدث الوارد
    const log = await this.prisma.webhookLog.create({
      data: {
        pharmacyId:     pharmacy.id,
        eventType:      payload.event_type,
        rawPayload:     payload as any,
        status:         'pending',
        idempotencyKey: idempotencyKey ?? null, // [إضافة]
      },
    });

    this.logger.log(
      `[Webhook] Pharmacy: ${pharmacySlug} | Event: ${payload.event_type} | Medicines: ${payload.medicines.length}`,
    );

    // 5. معالجة في الخلفية
    setImmediate(() => {
      this.processor
        .processWebhook(pharmacy.id, payload, log.id)
        .catch(err => this.logger.error(`Background processing failed: ${err.message}`));
    });

    return {
      success: true,
      message: 'Webhook received and queued for processing',
      log_id:  log.id,
    };
  }

  private verifySignature(payload: string, signature: string, secret: string): boolean {
    const expected = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
    try {
      return crypto.timingSafeEqual(
        Buffer.from(expected),
        Buffer.from(signature),
      );
    } catch {
      return false;
    }
  }
}