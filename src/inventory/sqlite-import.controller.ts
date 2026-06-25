// src/inventory/sqlite-import.controller.ts
/**
 * POST /inventory/import-sqlite/:pharmacySlug
 * ─────────────────────────────────────────────
 * استيراد مخزون صيدلية من ملف SQLite (medicore.db).
 *
 * الاستخدام:
 *   Content-Type: multipart/form-data
 *   file:             ملف .db
 *   replace_existing: true | false  (اختياري، افتراضي false)
 *
 * التوثيق: X-Pharmacy-Api-Key (نفس مفتاح الـ webhook)
 */
import {
  Controller, Post, Param, Headers,
  HttpCode, HttpStatus, Logger,
  UnauthorizedException, NotFoundException, BadRequestException,
  UseInterceptors, UploadedFile,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags, ApiOperation, ApiConsumes,
  ApiBody, ApiHeader, ApiParam, ApiQuery,
} from '@nestjs/swagger';
import { PrismaService }       from '../database/prisma.service';
import { SqliteImportService } from './sqlite-import.service';

@ApiTags('Inventory')
@Controller('inventory')
export class SqliteImportController {
  private readonly logger = new Logger(SqliteImportController.name);

  constructor(
    private readonly prisma:         PrismaService,
    private readonly sqliteImport:   SqliteImportService,
  ) {}

  /**
   * POST /inventory/import-sqlite/:pharmacySlug
   */
  @Post('import-sqlite/:pharmacySlug')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary:     'استيراد المخزون من ملف SQLite (medicore.db)',
    description:
      'ارفع ملف .db الخاص بـ MEDICORE مباشرةً. ' +
      'سيُستخرج منه جدول medicines وbatches تلقائياً. ' +
      'replace_existing=true يمسح المخزون القديم قبل الاستيراد.',
  })
  @ApiParam({ name: 'pharmacySlug', example: 'alandalos' })
  @ApiHeader({ name: 'X-Pharmacy-Api-Key', required: true })
  @ApiQuery({
    name:     'replace_existing',
    required: false,
    type:     Boolean,
    example:  false,
    description: 'true → امسح المخزون الحالي وأعد الاستيراد كاملاً',
  })
  @ApiBody({
    description: 'ملف SQLite (.db)',
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  async importFromSqlite(
    @Param('pharmacySlug')            slug:    string,
    @Headers('x-pharmacy-api-key')    apiKey:  string,
    @UploadedFile()                   file:    Express.Multer.File,
    @Query('replace_existing')        replaceStr?: string,
  ) {
    // ── التحقق من الصيدلية ──────────────────────────────────────────────
    const pharmacy = await this.prisma.pharmacy.findFirst({
      where: { slug, isActive: true },
    });
    if (!pharmacy) throw new NotFoundException(`Pharmacy "${slug}" not found`);
    if (pharmacy.apiKey !== apiKey) throw new UnauthorizedException('Invalid API key');

    // ── التحقق من الملف ──────────────────────────────────────────────────
    if (!file) {
      throw new BadRequestException('لم يُرفق أي ملف. أرسل ملف .db في حقل "file".');
    }
    if (!file.originalname.match(/\.(db|sqlite|sqlite3)$/i)) {
      throw new BadRequestException(
        `امتداد الملف "${file.originalname}" غير مدعوم. المدعومة: .db .sqlite .sqlite3`,
      );
    }

    const replaceExisting = replaceStr === 'true';

    this.logger.log(
      `[SQLiteImport] ${pharmacy.name} | file=${file.originalname} ` +
      `size=${(file.size / 1024).toFixed(1)}KB | replace=${replaceExisting}`,
    );

    // ── تشغيل الاستيراد ──────────────────────────────────────────────────
    const result = await this.sqliteImport.importFromBuffer(
      pharmacy.id,
      file.buffer,
      replaceExisting,
    );

    // ── الرد ─────────────────────────────────────────────────────────────
    return {
      success:  result.skipped < result.total,
      pharmacy: { id: pharmacy.id, name: pharmacy.name, slug: pharmacy.slug },
      file:     { name: file.originalname, size_kb: +(file.size / 1024).toFixed(1) },
      summary: {
        total:     result.total,
        processed: result.processed,
        created:   result.created,
        updated:   result.updated,
        skipped:   result.skipped,
      },
      errors:  result.errors.length > 0 ? result.errors : undefined,
      message: result.skipped === 0
        ? `تم استيراد ${result.total} دواء من الملف بنجاح`
        : `تم استيراد ${result.processed - result.skipped} من ${result.total}، فشل ${result.skipped}`,
    };
  }
}