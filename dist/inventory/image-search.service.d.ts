export interface ExtractionResult {
    found: boolean;
    medicineName?: string;
    alternativeNames?: string[];
    message?: string;
    rawResponse?: string;
}
export declare class ImageSearchService {
    private readonly logger;
    private readonly anthropic;
    constructor();
    extractMedicineFromImage(imageBuffer: Buffer, mimeType: string): Promise<ExtractionResult>;
}
