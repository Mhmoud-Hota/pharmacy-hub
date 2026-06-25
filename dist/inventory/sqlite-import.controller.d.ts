import { PrismaService } from '../database/prisma.service';
import { SqliteImportService } from './sqlite-import.service';
export declare class SqliteImportController {
    private readonly prisma;
    private readonly sqliteImport;
    private readonly logger;
    constructor(prisma: PrismaService, sqliteImport: SqliteImportService);
    importFromSqlite(slug: string, apiKey: string, file: Express.Multer.File, replaceStr?: string): Promise<{
        success: boolean;
        pharmacy: {
            id: number;
            name: string;
            slug: string;
        };
        file: {
            name: string;
            size_kb: number;
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
