// src/inventory/dto/bulk-import.dto.ts
import {
  IsString, IsNumber, IsOptional, IsArray,
  ValidateNested, Min, IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class StockItemDto {
  @ApiProperty({ description: 'الباركود — الأقوى للتعرف على الدواء', required: false, example: '6223001234567' })
  @IsOptional() @IsString()
  barcode?: string;

  @ApiProperty({ description: 'اسم الدواء كما هو في الصيدلية', example: 'فلوتاب 500' })
  @IsString()
  name: string;

  @ApiProperty({ required: false, example: 'Flutab' })
  @IsOptional() @IsString()
  trad_name?: string;

  @ApiProperty({ required: false, example: 'Paracetamol' })
  @IsOptional() @IsString()
  scientific_name?: string;

  @ApiProperty({ description: 'id الدواء في قاعدة بيانات الصيدلية المحلية', example: 42 })
  @IsNumber()
  local_medicine_id: number;

  @ApiProperty({ description: 'الكمية الحالية في المخزون', example: 120 })
  @IsNumber() @Min(0)
  quantity: number;

  @ApiProperty({ required: false, example: 15.5 })
  @IsOptional() @IsNumber()
  price?: number;

  @ApiProperty({ required: false, example: 'علبة' })
  @IsOptional() @IsString()
  unit?: string;

  @ApiProperty({ required: false, example: 20 })
  @IsOptional() @IsNumber()
  tablets_per_box?: number;

  @ApiProperty({ required: false, example: '2026-12-01' })
  @IsOptional() @IsString()
  expiry_date?: string;

  @ApiProperty({ required: false, example: 'مسكنات' })
  @IsOptional() @IsString()
  category?: string;
}

export class BulkImportDto {
  @ApiProperty({
    description: 'قائمة كل أدوية الصيدلية',
    type: [StockItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StockItemDto)
  medicines: StockItemDto[];

  @ApiProperty({
    description: 'هل تستبدل المخزون الموجود كاملاً؟ (true = امسح القديم أولاً)',
    required: false,
    default: false,
  })
  @IsOptional() @IsBoolean()
  replace_existing?: boolean = false;
}
