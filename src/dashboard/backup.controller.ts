// src/dashboard/backup.controller.ts
import {
  Controller, Get, Post, Delete, Body, Param,
  Query, ParseIntPipe, Res, HttpCode, HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiExcludeController } from '@nestjs/swagger';
import { BackupService } from './backup.service';

@ApiExcludeController()
@Controller('api/dashboard/backup')
export class BackupController {
  constructor(private readonly svc: BackupService) {}

  // ── نسخ احتياطي كامل (JSON) ──────────────────────────────────────────────
  @Get('full')
  async fullBackup(@Res() res: Response) {
    const data = await this.svc.fullBackup();
    const filename = `pharmacy-hub-full-${new Date().toISOString().split('T')[0]}.json`;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(JSON.stringify(data, null, 2));
  }

  // ── نسخ احتياطي لصيدلية معينة (JSON) ────────────────────────────────────
  @Get('pharmacy/:id')
  async pharmacyBackup(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    const data = await this.svc.pharmacyBackup(id);
    const filename = `pharmacy-${data.meta.pharmacySlug}-${data.meta.exportedAt.split('T')[0]}.json`;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(JSON.stringify(data, null, 2));
  }

  // ── نسخ احتياطي لصيدلية معينة (CSV) ─────────────────────────────────────
  @Get('pharmacy/:id/csv')
  async pharmacyBackupCsv(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    const csv      = await this.svc.pharmacyBackupCsv(id);
    const pharmacy = await this.svc.pharmacyBackup(id);
    const filename = `pharmacy-${pharmacy.meta.pharmacySlug}-${new Date().toISOString().split('T')[0]}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send('\uFEFF' + csv); // BOM for Excel Arabic support
  }

  // ── تفريغ مخزون صيدلية ───────────────────────────────────────────────────
  @Delete('pharmacy/:id/clear')
  @HttpCode(HttpStatus.OK)
  clearStock(@Param('id', ParseIntPipe) id: number) {
    return this.svc.clearPharmacyStock(id);
  }

  // ── استيراد CSV ──────────────────────────────────────────────────────────
  @Post('pharmacy/:id/import/csv')
  @HttpCode(HttpStatus.OK)
  importCsv(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { csv: string; mode?: 'merge' | 'replace' },
  ) {
    return this.svc.importFromCsv(id, body.csv, body.mode ?? 'merge');
  }

  // ── استيراد JSON ─────────────────────────────────────────────────────────
  @Post('pharmacy/:id/import/json')
  @HttpCode(HttpStatus.OK)
  importJson(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { data: any; mode?: 'merge' | 'replace' },
  ) {
    return this.svc.importFromJson(id, body.data, body.mode ?? 'merge');
  }

  // ── إحصائيات البحث ───────────────────────────────────────────────────────
  @Get('search-stats')
  getSearchStats(@Query('days') days = '30') {
    return this.svc.getSearchStats(+days);
  }
}
