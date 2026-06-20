import { PrismaService } from '../database/prisma.service';
import { MedicineResolverService } from './medicine-resolver.service';
import { WebhookPayloadDto } from './dto/webhook-payload.dto';
export declare class WebhookProcessorService {
    private readonly prisma;
    private readonly medicineResolver;
    private readonly logger;
    constructor(prisma: PrismaService, medicineResolver: MedicineResolverService);
    processWebhook(pharmacyId: number, payload: WebhookPayloadDto, logId: number): Promise<void>;
    private processMedicine;
    private calculateQuantityDelta;
    private upsertStock;
}
