import OpenAI from 'openai';
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
    client: OpenAI;
    constructor();
    extractMedicineFromImage(imageBuffer: Buffer, mimeType: string): Promise<ExtractionResult>;
}
