import { GeoSearchService } from './geo-search.service';
import { ImageSearchService } from './image-search.service';
export declare class ImageSearchDto {
    lat?: string;
    lng?: string;
    radius?: string;
}
export declare class ImageSearchController {
    private readonly imageSearchService;
    private readonly geoSearchService;
    private readonly logger;
    constructor(imageSearchService: ImageSearchService, geoSearchService: GeoSearchService);
    searchByImage(file: Express.Multer.File, body: ImageSearchDto): Promise<{
        success: boolean;
        message: string;
        extracted_names: any[];
        results_count: number;
        results: any[];
        extracted_name?: undefined;
        alternative_names?: undefined;
        searched_with?: undefined;
        user_location?: undefined;
        radius_km?: undefined;
    } | {
        success: boolean;
        extracted_name: string;
        alternative_names: string[];
        searched_with: string;
        user_location: {
            latitude: number;
            longitude: number;
        };
        radius_km: number;
        results_count: number;
        results: import("./geo-search.service").MedicineSearchResult[];
        message?: undefined;
        extracted_names?: undefined;
    }>;
}
