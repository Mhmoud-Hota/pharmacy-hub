import { PrismaService } from '../database/prisma.service';
import { BulkImportService } from './bulk-import.service';
import { BulkImportDto } from './dto/bulk-import.dto';
export declare class BulkImportController {
    private readonly prisma;
    private readonly bulkImport;
    private readonly logger;
    constructor(prisma: PrismaService, bulkImport: BulkImportService);
    importStock(slug: string, apiKey: string, dto: BulkImportDto): Promise<{
        success: boolean;
        pharmacy: {
            id: number;
            name: string;
            slug: string;
        };
        summary: {
            total: number;
            processed: number;
            created: number;
            updated: number;
            skipped: number;
        };
        errors: string[];
        message: string;
    }>;
}
