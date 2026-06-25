import { Response } from 'express';
import { BackupService } from './backup.service';
export declare class BackupController {
    private readonly svc;
    constructor(svc: BackupService);
    fullBackup(res: Response): Promise<void>;
    pharmacyBackup(id: number, res: Response): Promise<void>;
    pharmacyBackupCsv(id: number, res: Response): Promise<void>;
    clearStock(id: number): Promise<{
        deleted: number;
    }>;
    importCsv(id: number, body: {
        csv: string;
        mode?: 'merge' | 'replace';
    }): Promise<{
        imported: number;
        skipped: number;
        errors: string[];
    }>;
    importJson(id: number, body: {
        data: any;
        mode?: 'merge' | 'replace';
    }): Promise<{
        imported: number;
        skipped: number;
    }>;
    importSql(id: number, body: {
        sql: string;
        mode?: 'merge' | 'replace';
    }): Promise<{
        imported: number;
        skipped: number;
        errors: string[];
        detected_rows: number;
    }>;
    getSearchStats(days?: string): Promise<{
        period: {
            days: number;
            since: string;
        };
        summary: {
            total_medicines: number;
            available_now: number;
            out_of_stock: number;
            total_events: number;
        };
        top_medicines: {
            id: number;
            name: string;
            category: string;
            aliases_count: number;
            total_qty: number;
            pharmacy_count: number;
            avg_price: number;
        }[];
        by_category: {
            category: string;
            count: number;
        }[];
        active_pharmacies: {
            pharmacy_id: number;
            pharmacy_name: string;
            event_count: number;
        }[];
        daily_activity: {
            date: string;
            count: number;
        }[];
        event_types: {
            type: string;
            count: number;
        }[];
    }>;
}
