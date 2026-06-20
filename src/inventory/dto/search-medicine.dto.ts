// src/inventory/dto/search-medicine.dto.ts
import { IsString, IsOptional, IsNumber, Min, Max, IsBoolean } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class SearchMedicineDto {
  @ApiProperty({
    description: 'اسم الدواء أو جزء منه أو الباركود — مثال: flutab أو فلوتاب',
    example: 'flutab',
  })
  @IsString()
  q: string;

  // ── موقع المستخدم (اختياري) ──────────────────────────────────────────────

  @ApiProperty({
    description: 'خط العرض للمستخدم (latitude)',
    example: 30.0444,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-90) @Max(90)
  lat?: number;

  @ApiProperty({
    description: 'خط الطول للمستخدم (longitude)',
    example: 31.2357,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-180) @Max(180)
  lng?: number;

  @ApiProperty({
    description: 'نطاق البحث الجغرافي (كيلومتر) — 0 يعني بلا حد',
    example: 5,
    required: false,
    default: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  radius?: number = 0;

  @ApiProperty({
    description: 'أظهر فقط الصيدليات التي لديها الدواء متاح (quantity > 0)',
    required: false,
    default: true,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'false' ? false : true)
  @IsBoolean()
  only_available?: boolean = true;
}
