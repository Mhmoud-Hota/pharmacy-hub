// src/inventory/bulk-import.controller.ts
/**
 * POST /inventory/import/:pharmacySlug
 * ──────────────────────────────────────
 * نقطة الدخول لرفع المخزون الكامل لصيدلية.
 *
 * تُستخدم في 3 حالات:
 *  1. عند إعداد صيدلية جديدة أول مرة
 *  2. بعد عملية جرد يدوي لتصحيح الأرقام
 *  3. مزامنة دورية (cron job يومي مثلاً)
 *
 * التوثيق: نفس مفتاح الـ webhook (X-Pharmacy-Api-Key)
 */
import {
  Controller, Post, Body, Param,
  Headers, HttpCode, HttpStatus,
  UnauthorizedException, BadRequestException, NotFoundException,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader, ApiParam, ApiBody } from '@nestjs/swagger';
import { PrismaService } from '../database/prisma.service';
import { BulkImportService } from './bulk-import.service';
import { BulkImportDto } from './dto/bulk-import.dto';

@ApiTags('Inventory')
@Controller('inventory')
export class BulkImportController {
  private readonly logger = new Logger(BulkImportController.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly bulkImport: BulkImportService,
  ) {}

  /**
   * POST /inventory/import/:pharmacySlug
   *
   * Body: { medicines: [...], replace_existing: false }
   *
   * replace_existing:
   *   false (افتراضي) → يضيف/يحدّث فقط، لا يحذف ما هو موجود
   *   true            → يمسح مخزون الصيدلية أولاً ثم يُعيد الاستيراد
   *                     (مفيد بعد جرد يدوي شامل)
   */
  @Post('import/:pharmacySlug')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'رفع المخزون الكامل لصيدلية (bulk import)',
    description:
      'يُستخدم لرفع المخزون الأولي أو بعد جرد يدوي. ' +
      'replace_existing=true يمسح القديم ويعيد الاستيراد. ' +
      'replace_existing=false (افتراضي) يُحدّث أو يضيف فقط.',
  })
  @ApiParam({ name: 'pharmacySlug', example: 'pharmacy-cairo-1' })
  @ApiHeader({ name: 'X-Pharmacy-Api-Key', required: true })
  async importStock(
    @Param('pharmacySlug') slug: string,
    @Headers('x-pharmacy-api-key') apiKey: string,
    @Body() dto: BulkImportDto,
  ) {
    // ── التحقق من الصيدلية ──────────────────────────────────────────────
    const pharmacy = await this.prisma.pharmacy.findFirst({
      where: { slug, isActive: true },
    });

    if (!pharmacy) throw new NotFoundException(`Pharmacy "${slug}" not found`);
    if (pharmacy.apiKey !== apiKey) throw new UnauthorizedException('Invalid API key');

    if (!dto.medicines?.length) {
      throw new BadRequestException('قائمة الأدوية فارغة');
    }

    this.logger.log(
      `[Import] ${pharmacy.name} → ${dto.medicines.length} medicines | replace=${dto.replace_existing}`
    );

    // ── تشغيل الاستيراد ──────────────────────────────────────────────────
    const result = await this.bulkImport.importPharmacyStock(pharmacy.id, dto);

    return {
      success:  result.skipped < result.total,
      pharmacy: { id: pharmacy.id, name: pharmacy.name, slug: pharmacy.slug },
      summary: {
        total:     result.total,
        processed: result.processed,
        created:   result.created,    // أدوية جديدة أُضيفت للقاعدة المركزية
        updated:   result.updated,    // أدوية موجودة حُدّث مخزونها
        skipped:   result.skipped,    // فشل معالجتها
      },
      errors: result.errors.length > 0 ? result.errors : undefined,
      message: result.skipped === 0
        ? `تم استيراد ${result.total} دواء بنجاح`
        : `تم استيراد ${result.processed - result.skipped} من ${result.total}، فشل ${result.skipped}`,
    };
  }
}
