// src/webhook/dto/webhook-payload.dto.ts
import { IsString, IsNumber, IsOptional, IsEnum, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

// ─── أنواع الأحداث الواردة من الصيدليات ─────────────────────────────────────
export enum WebhookEventType {
  SALE          = 'sale',           // تمت عملية بيع
  STOCK_ADDED   = 'stock_added',    // أُضيف مخزون جديد
  STOCK_REMOVED = 'stock_removed',  // حُذف مخزون
  SHORTAGE      = 'shortage',       // نقص في المخزون
  RETURN        = 'return',         // إرجاع بضاعة
  STOCK_UPDATE  = 'stock_update',   // تحديث كمية مباشر
}

// ─── بيانات دواء واحد داخل الحدث ────────────────────────────────────────────
export class MedicinePayloadDto {
  @ApiProperty({ description: 'الباركود - المعرّف الموحّد', required: false })
  @IsOptional()
  @IsString()
  barcode?: string;

  @ApiProperty({ description: 'اسم الدواء في هذه الصيدلية' })
  @IsString()
  name: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  trad_name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  scientific_name?: string;

  @ApiProperty({ description: 'id الدواء في قاعدة بيانات الصيدلية' })
  @IsNumber()
  local_medicine_id: number;

  @ApiProperty({ description: 'الكمية المتأثرة في هذا الحدث' })
  @IsNumber()
  quantity_affected: number;

  @ApiProperty({ description: 'الكمية الإجمالية الحالية في الصيدلية', required: false })
  @IsOptional()
  @IsNumber()
  current_quantity?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  price?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  tablets_per_box?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  expiry_date?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  category?: string;
}

// ─── الـ Payload الكامل من الصيدلية ──────────────────────────────────────────
export class WebhookPayloadDto {
  @ApiProperty({ enum: WebhookEventType })
  @IsEnum(WebhookEventType)
  event_type: WebhookEventType;

  @ApiProperty({ description: 'timestamp الحدث' })
  @IsString()
  timestamp: string;

  @ApiProperty({ description: 'الأدوية المتأثرة بهذا الحدث', type: [MedicinePayloadDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MedicinePayloadDto)
  medicines: MedicinePayloadDto[];

  @ApiProperty({ description: 'id الفاتورة أو العملية إن وُجدت', required: false })
  @IsOptional()
  @IsNumber()
  reference_id?: number;

  @ApiProperty({ description: 'بيانات إضافية اختيارية', required: false })
  @IsOptional()
  metadata?: Record<string, any>;
}
