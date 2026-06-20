export declare class StockItemDto {
    barcode?: string;
    name: string;
    trad_name?: string;
    scientific_name?: string;
    local_medicine_id: number;
    quantity: number;
    price?: number;
    unit?: string;
    tablets_per_box?: number;
    expiry_date?: string;
    category?: string;
}
export declare class BulkImportDto {
    medicines: StockItemDto[];
    replace_existing?: boolean;
}
