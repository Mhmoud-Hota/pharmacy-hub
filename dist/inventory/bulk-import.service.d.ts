import { PrismaService } from '../database/prisma.service';
import { MedicineResolverService } from '../webhook/medicine-resolver.service';
import { BulkImportDto } from './dto/bulk-import.dto';
export interface ImportProgress {
    total: number;
    processed: number;
    created: number;
    updated: number;
    skipped: number;
    errors: string[];
}
export declare class BulkImportService {
    private readonly prisma;
    private readonly medicineResolver;
    private readonly logger;
    private readonly BATCH_SIZE;
    constructor(prisma: PrismaService, medicineResolver: MedicineResolverService);
    importPharmacyStock(pharmacyId: number, dto: BulkImportDto): Promise<ImportProgress>;
    private processOneItem;
    private chunk;
}
