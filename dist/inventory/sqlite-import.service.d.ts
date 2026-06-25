import { BulkImportService, ImportProgress } from './bulk-import.service';
export declare class SqliteImportService {
    private readonly bulkImport;
    private readonly logger;
    constructor(bulkImport: BulkImportService);
    importFromBuffer(pharmacyId: number, buffer: Buffer, replaceExisting: boolean): Promise<ImportProgress>;
    private query;
    private validateSchema;
    private fetchMedicines;
    private fetchBatchSummary;
}
