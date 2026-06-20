import { PrismaService } from '../database/prisma.service';
import { WebhookProcessorService } from './webhook-processor.service';
import { WebhookPayloadDto } from './dto/webhook-payload.dto';
export declare class WebhookController {
    private readonly prisma;
    private readonly processor;
    private readonly logger;
    constructor(prisma: PrismaService, processor: WebhookProcessorService);
    receiveWebhook(pharmacySlug: string, apiKey: string, signature: string, idempotencyKey: string, payload: WebhookPayloadDto): Promise<{
        success: boolean;
        message: string;
        log_id: number;
    }>;
    private verifySignature;
}
