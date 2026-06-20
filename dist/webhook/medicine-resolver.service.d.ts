import { PrismaService } from '../database/prisma.service';
import { MedicinePayloadDto } from './dto/webhook-payload.dto';
export declare class MedicineResolverService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    resolveOrCreate(medicine: MedicinePayloadDto, pharmacyId: number): Promise<number>;
    private upsertAlias;
    normalizeName(name: string): string;
}
