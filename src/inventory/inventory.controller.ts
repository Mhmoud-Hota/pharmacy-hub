// src/inventory/inventory.controller.ts
import {
  Controller, Get, Param, Query,
  NotFoundException, BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiParam } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { GeoSearchService } from './geo-search.service';
import { SearchMedicineDto } from './dto/search-medicine.dto';

@ApiTags('Inventory')
@Controller('inventory')
export class InventoryController {
  constructor(
    private readonly inventoryService: InventoryService,
    private readonly geoSearchService: GeoSearchService,
  ) {}

  // ─── البحث الجغرافي عن دواء ───────────────────────────────────────────────
  // GET /inventory/find?q=flutab&lat=30.04&lng=31.23&radius=5
  @Get('find')
  @ApiOperation({
    summary: 'البحث عن دواء مع الترتيب بالمسافة',
    description:
      'ابحث عن دواء في كل الصيدليات.' +
      ' أرسل lat/lng لترتيب النتائج من الأقرب للأبعد.' +
      ' استخدم radius لتحديد نطاق البحث (كيلومتر).',
  })
  @ApiQuery({ name: 'q',              description: 'اسم الدواء أو الباركود', example: 'flutab' })
  @ApiQuery({ name: 'lat',            description: 'خط العرض (latitude)',    required: false, example: 30.0444 })
  @ApiQuery({ name: 'lng',            description: 'خط الطول (longitude)',   required: false, example: 31.2357 })
  @ApiQuery({ name: 'radius',         description: 'نطاق البحث بالكيلومتر (0 = بلا حد)', required: false, example: 5 })
  @ApiQuery({ name: 'only_available', description: 'صيدليات متوفر فيها فقط', required: false })
  async findMedicine(@Query() query: SearchMedicineDto) {
    if (!query.q || query.q.trim().length < 2) {
      throw new BadRequestException('يجب إدخال اسم الدواء (حرفين على الأقل)');
    }
    const hasLat = query.lat !== undefined;
    const hasLng = query.lng !== undefined;
    if (hasLat !== hasLng) {
      throw new BadRequestException('يجب إرسال lat و lng معاً أو لا شيء');
    }
    const userLocation = hasLat && hasLng
      ? { latitude: query.lat!, longitude: query.lng! }
      : undefined;

    const results = await this.geoSearchService.searchMedicineNearby(
      query.q.trim(),
      userLocation,
      query.radius ?? 0,
      query.only_available ?? true,
    );
    return {
      query:         query.q,
      user_location: userLocation ?? null,
      radius_km:     userLocation ? (query.radius ?? 0) : null,
      results_count: results.length,
      results,
    };
  }

  // ─── ملخص كل الصيدليات ────────────────────────────────────────────────────
  @Get('summary')
  @ApiOperation({ summary: 'ملخص المخزون لكل الصيدليات' })
  getSummary() { return this.inventoryService.getSummary(); }

  // ─── بحث بسيط بدون موقع ───────────────────────────────────────────────────
  @Get('search')
  @ApiOperation({ summary: 'بحث بسيط عن دواء (بدون إحداثيات)' })
  @ApiQuery({ name: 'q' })
  search(@Query('q') q: string) { return this.inventoryService.searchMedicine(q ?? ''); }

  // ─── الأدوية التي كادت تنفد ───────────────────────────────────────────────
  @Get('low-stock')
  @ApiOperation({ summary: 'الأدوية التي كادت تنفد' })
  @ApiQuery({ name: 'threshold', required: false })
  @ApiQuery({ name: 'pharmacy',  required: false })
  getLowStock(@Query('threshold') threshold?: string, @Query('pharmacy') pharmacySlug?: string) {
    return this.inventoryService.getLowStock(threshold ? parseInt(threshold) : 10, pharmacySlug);
  }

  // ─── كل المخزون مجمّع ─────────────────────────────────────────────────────
  @Get()
  @ApiOperation({ summary: 'كل المخزون من كل الصيدليات مجمّعاً' })
  @ApiQuery({ name: 'page',     required: false })
  @ApiQuery({ name: 'limit',    required: false })
  @ApiQuery({ name: 'barcode',  required: false })
  @ApiQuery({ name: 'name',     required: false })
  @ApiQuery({ name: 'category', required: false })
  getAll(
    @Query('page') page = '1', @Query('limit') limit = '50',
    @Query('barcode') barcode?: string, @Query('name') medicineName?: string,
    @Query('category') category?: string,
  ) {
    return this.inventoryService.getAggregatedStock({
      page: parseInt(page), limit: parseInt(limit), barcode, medicineName, category,
    });
  }

  // ─── مخزون صيدلية واحدة ───────────────────────────────────────────────────
  @Get('pharmacy/:slug')
  @ApiOperation({ summary: 'مخزون صيدلية محددة' })
  @ApiParam({ name: 'slug' })
  @ApiQuery({ name: 'page', required: false }) @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'barcode', required: false }) @ApiQuery({ name: 'name', required: false })
  @ApiQuery({ name: 'category', required: false }) @ApiQuery({ name: 'low_stock', required: false })
  async getPharmacyStock(
    @Param('slug') slug: string,
    @Query('page') page = '1', @Query('limit') limit = '50',
    @Query('barcode') barcode?: string, @Query('name') medicineName?: string,
    @Query('category') category?: string, @Query('low_stock') lowStock?: string,
  ) {
    const result = await this.inventoryService.getPharmacyStock(slug, {
      page: parseInt(page), limit: parseInt(limit),
      barcode, medicineName, category,
      lowStockThreshold: lowStock ? parseInt(lowStock) : undefined,
    });
    if (!result) throw new NotFoundException(`Pharmacy "${slug}" not found`);
    return result;
  }
}
