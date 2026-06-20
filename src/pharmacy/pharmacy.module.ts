// src/pharmacy/pharmacy.module.ts
import { Module } from '@nestjs/common';
import {
  Controller, Get, Post, Patch, Body, Param,
  NotFoundException, ConflictException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import * as crypto from 'crypto';
import { PrismaService } from '../database/prisma.service';

// ─── DTOs ────────────────────────────────────────────────────────────────────

class CreatePharmacyDto {
  @IsString()
  name: string;

  @IsString()
  slug: string;

  @IsOptional() @IsString()
  address?: string;

  @IsOptional() @IsString()
  city?: string;

  @IsOptional() @IsString()
  phone?: string;

  @IsOptional() @IsString()
  workingHours?: string;  // مثال: "08:00-22:00"

  // الإحداثيات الجغرافية
  @IsOptional() @Type(() => Number) @IsNumber() @Min(-90)  @Max(90)
  latitude?: number;

  @IsOptional() @Type(() => Number) @IsNumber() @Min(-180) @Max(180)
  longitude?: number;
}

class UpdateLocationDto {
  @Type(() => Number) @IsNumber() @Min(-90)  @Max(90)
  latitude: number;

  @Type(() => Number) @IsNumber() @Min(-180) @Max(180)
  longitude: number;

  @IsOptional() @IsString()
  address?: string;

  @IsOptional() @IsString()
  city?: string;
}

// ─── Controller ───────────────────────────────────────────────────────────────

@ApiTags('Pharmacies')
@Controller('pharmacies')
export class PharmacyController {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * POST /pharmacies
   * تسجيل صيدلية جديدة مع إحداثياتها الجغرافية
   */
  @Post()
  @ApiOperation({ summary: 'تسجيل صيدلية جديدة' })
  async create(@Body() dto: CreatePharmacyDto) {
    const exists = await this.prisma.pharmacy.findUnique({ where: { slug: dto.slug } });
    if (exists) throw new ConflictException(`Slug "${dto.slug}" already taken`);

    const apiKey        = crypto.randomBytes(32).toString('hex');
    const webhookSecret = crypto.randomBytes(32).toString('hex');

    const pharmacy = await this.prisma.pharmacy.create({
      data: {
        name:         dto.name,
        slug:         dto.slug,
        apiKey,
        webhookSecret,
        address:      dto.address      ?? null,
        city:         dto.city         ?? null,
        phone:        dto.phone        ?? null,
        workingHours: dto.workingHours ?? null,
        latitude:     dto.latitude     ?? null,
        longitude:    dto.longitude    ?? null,
      },
    });

    return {
      id:             pharmacy.id,
      name:           pharmacy.name,
      slug:           pharmacy.slug,
      location:       pharmacy.latitude ? { lat: pharmacy.latitude, lng: pharmacy.longitude } : null,
      api_key:        apiKey,
      webhook_secret: webhookSecret,
      webhook_url:    `/webhooks/${pharmacy.slug}`,
      message:        'احتفظ بهذه المفاتيح في مكان آمن - لن تُعرض مجدداً',
    };
  }

  /**
   * PATCH /pharmacies/:slug/location
   * تحديث موقع صيدلية موجودة
   */
  @Patch(':slug/location')
  @ApiOperation({ summary: 'تحديث الموقع الجغرافي للصيدلية' })
  @ApiParam({ name: 'slug' })
  async updateLocation(@Param('slug') slug: string, @Body() dto: UpdateLocationDto) {
    const pharmacy = await this.prisma.pharmacy.findUnique({ where: { slug } });
    if (!pharmacy) throw new NotFoundException(`Pharmacy "${slug}" not found`);

    const updated = await this.prisma.pharmacy.update({
      where: { slug },
      data: {
        latitude:  dto.latitude,
        longitude: dto.longitude,
        address:   dto.address ?? pharmacy.address,
        city:      dto.city    ?? pharmacy.city,
      },
    });

    return {
      slug:     updated.slug,
      location: { lat: updated.latitude, lng: updated.longitude },
      address:  updated.address,
      city:     updated.city,
    };
  }

  /**
   * GET /pharmacies
   * قائمة الصيدليات مع مواقعها
   */
  @Get()
  @ApiOperation({ summary: 'قائمة كل الصيدليات' })
  async findAll() {
    return this.prisma.pharmacy.findMany({
      select: {
        id: true, name: true, slug: true, isActive: true,
        address: true, city: true, phone: true, workingHours: true,
        latitude: true, longitude: true,
        createdAt: true,
        _count: { select: { stocks: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * GET /pharmacies/:slug/webhook-logs
   */
  @Get(':slug/webhook-logs')
  @ApiOperation({ summary: 'سجلات الـ webhooks لصيدلية' })
  async getWebhookLogs(@Param('slug') slug: string) {
    const pharmacy = await this.prisma.pharmacy.findUnique({ where: { slug } });
    if (!pharmacy) throw new NotFoundException();

    return this.prisma.webhookLog.findMany({
      where:   { pharmacyId: pharmacy.id },
      orderBy: { createdAt: 'desc' },
      take:    100,
      select: {
        id: true, eventType: true, status: true,
        errorMsg: true, processedAt: true, createdAt: true,
      },
    });
  }
}

// ─── Module ───────────────────────────────────────────────────────────────────
@Module({
  controllers: [PharmacyController],
})
export class PharmacyModule {}
