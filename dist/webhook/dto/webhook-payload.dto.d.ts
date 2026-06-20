export declare enum WebhookEventType {
    SALE = "sale",
    STOCK_ADDED = "stock_added",
    STOCK_REMOVED = "stock_removed",
    SHORTAGE = "shortage",
    RETURN = "return",
    STOCK_UPDATE = "stock_update"
}
export declare class MedicinePayloadDto {
    barcode?: string;
    name: string;
    trad_name?: string;
    scientific_name?: string;
    local_medicine_id: number;
    quantity_affected: number;
    current_quantity?: number;
    price?: number;
    unit?: string;
    tablets_per_box?: number;
    expiry_date?: string;
    category?: string;
}
export declare class WebhookPayloadDto {
    event_type: WebhookEventType;
    timestamp: string;
    medicines: MedicinePayloadDto[];
    reference_id?: number;
    metadata?: Record<string, any>;
}
