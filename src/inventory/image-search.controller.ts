// src/inventory/image-search.controller.ts
/**
 * ImageSearchController
 * ─────────────────────
 * يستقبل صورة روشتة أو دواء، يستخرج اسم الدواء باستخدام Claude AI،
 * ثم يبحث عنه في المخزون المتعدد.
 *
 * POST /inventory/image-search
 *   - multipart/form-data
 *   - field: image (File)
 *   - field: lat   (optional)
 *   - field: lng   (optional)
 *   - field: radius (optional, default 0 = بلا حد)
 */

import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Body,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { GeoSearchService } from './geo-search.service';
import { ImageSearchService } from './image-search.service';

export class ImageSearchDto {
  lat?: string;
  lng?: string;
  radius?: string;
}

@ApiTags('Inventory')
@Controller('inventory')
export class ImageSearchController {
  private readonly logger = new Logger(ImageSearchController.name);

  constructor(
    private readonly imageSearchService: ImageSearchService,
    private readonly geoSearchService: GeoSearchService,
  ) {}

  @Post('image-search')
  @ApiOperation({
    summary: 'البحث عن دواء عبر صورة (روشتة أو علبة دواء)',
    description:
      'أرسل صورة روشتة أو علبة دواء. سيستخرج النظام اسم الدواء تلقائياً ويبحث عنه في المخزون.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        image:  { type: 'string', format: 'binary' },
        lat:    { type: 'number', description: 'خط العرض (اختياري)' },
        lng:    { type: 'number', description: 'خط الطول (اختياري)' },
        radius: { type: 'number', description: 'نطاق البحث بالكيلومتر (0 = بلا حد)' },
      },
      required: ['image'],
    },
  })
  @UseInterceptors(
    FileInterceptor('image', {
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/^image\/(jpeg|png|webp|gif)$/)) {
          return cb(new BadRequestException('يُقبل فقط ملفات الصور (jpeg, png, webp)'), false);
        }
        cb(null, true);
      },
    }),
  )
  async searchByImage(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: ImageSearchDto,
  ) {
    if (!file) {
      throw new BadRequestException('يجب إرسال صورة');
    }

    this.logger.log(`Image search: ${file.originalname} (${file.size} bytes)`);

    // ── 1. استخراج اسم الدواء من الصورة ─────────────────────────────────────
    const extractionResult = await this.imageSearchService.extractMedicineFromImage(
      file.buffer,
      file.mimetype,
    );

    if (!extractionResult.found || !extractionResult.medicineName) {
      return {
        success: false,
        message: extractionResult.message ?? 'لم يتم التعرف على اسم دواء في الصورة',
        extracted_names: [],
        results_count: 0,
        results: [],
      };
    }

    this.logger.log(`Extracted medicine name: "${extractionResult.medicineName}"`);

    // ── 2. البحث في المخزون ───────────────────────────────────────────────────
    const hasLat = body.lat !== undefined && body.lat !== '';
    const hasLng = body.lng !== undefined && body.lng !== '';

    const userLocation =
      hasLat && hasLng
        ? { latitude: parseFloat(body.lat!), longitude: parseFloat(body.lng!) }
        : undefined;

    const radius = body.radius ? parseFloat(body.radius) : 0;

    const results = await this.geoSearchService.searchMedicineNearby(
      extractionResult.medicineName,
      userLocation,
      radius,
      true,
    );

    // ── 3. لو النتيجة الأولى فارغة، جرّب الأسماء الإضافية ──────────────────
    let finalResults = results;
    let usedName = extractionResult.medicineName;

    if (results.length === 0 && extractionResult.alternativeNames?.length) {
      for (const altName of extractionResult.alternativeNames) {
        const altResults = await this.geoSearchService.searchMedicineNearby(
          altName,
          userLocation,
          radius,
          true,
        );
        if (altResults.length > 0) {
          finalResults = altResults;
          usedName = altName;
          break;
        }
      }
    }

    return {
      success: true,
      extracted_name:      extractionResult.medicineName,
      alternative_names:   extractionResult.alternativeNames ?? [],
      searched_with:       usedName,
      user_location:       userLocation ?? null,
      radius_km:           userLocation ? radius : null,
      results_count:       finalResults.length,
      results:             finalResults,
    };
  }
}