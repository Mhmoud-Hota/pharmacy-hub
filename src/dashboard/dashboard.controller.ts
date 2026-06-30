// src/dashboard/dashboard.controller.ts
import {
  Controller, Get, Post, Put, Patch, Delete,
  Body, Param, Query, ParseIntPipe,
  HttpCode, HttpStatus, HttpException,
} from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { DashboardService }     from './dashboard.service';

@ApiExcludeController()
@Controller('api/dashboard')
export class DashboardController {
  constructor(private readonly svc: DashboardService) {}

  // ── STATS ──────────────────────────────────────────────────────────────────
  @Get('stats')
  getStats() { return this.svc.getStats(); }

  /**
   * GET /api/dashboard/analytics?days=30
   * اتجاهات البحث، ساعات الذروة، الأكثر بحثاً، معدل النمو،
   * المستخدمون النشطون (الآن / اليوم)، ونقاط لخريطة حرارية
   */
  @Get('analytics')
  getAnalytics(@Query('days') days = '30') {
    return this.svc.getAnalytics(+days);
  }

  // ── PHARMACIES ─────────────────────────────────────────────────────────────
  @Get('pharmacies')
  getPharmacies() { return this.svc.getPharmacies(); }

  @Get('pharmacies/:id')
  getPharmacy(@Param('id', ParseIntPipe) id: number) { return this.svc.getPharmacyDetail(id); }

  @Get('pharmacies/:id/stats')
  getPharmacyStats(@Param('id', ParseIntPipe) id: number) { return this.svc.getPharmacyStats(id); }

  /**
   * GET /api/dashboard/pharmacies/:id/stock
   * مخزون صيدلية واحدة مع بحث + فلتر تصنيف + فلتر مخزون منخفض + ترقيم صفحات
   */
  @Get('pharmacies/:id/stock')
  getPharmacyStock(
    @Param('id', ParseIntPipe) id: number,
    @Query('page')     page     = '1',
    @Query('limit')    limit    = '50',
    @Query('search')   search   = '',
    @Query('category') category = '',
    @Query('low_stock') lowStock = '',
  ) {
    return this.svc.getPharmacyStock(id, +page, +limit, search, category, lowStock === 'true');
  }

  @Post('pharmacies')
  createPharmacy(@Body() body: any) { return this.svc.createPharmacy(body); }

  @Put('pharmacies/:id')
  updatePharmacy(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.svc.updatePharmacy(id, body);
  }

  @Patch('pharmacies/:id/toggle')
  togglePharmacy(@Param('id', ParseIntPipe) id: number, @Body() body: { active: boolean }) {
    return this.svc.togglePharmacy(id, body.active);
  }

  @Post('pharmacies/:id/regenerate-key')
  @HttpCode(HttpStatus.OK)
  regenerateKey(@Param('id', ParseIntPipe) id: number) { return this.svc.regenerateApiKey(id); }

  // ── MEDICINES ──────────────────────────────────────────────────────────────
  @Get('medicines')
  getMedicines(
    @Query('page')     page     = '1',
    @Query('limit')    limit    = '50',
    @Query('search')   search   = '',
    @Query('category') category = '',
  ) { return this.svc.getMedicines(+page, +limit, search, category); }

  // ── WEBHOOK LOGS ───────────────────────────────────────────────────────────
  @Get('webhook-logs')
  getLogs(
    @Query('page')       page       = '1',
    @Query('pharmacyId') pharmacyId?: string,
    @Query('status')     status?:    string,
  ) { return this.svc.getWebhookLogs(+page, pharmacyId ? +pharmacyId : undefined, status); }

  // ══════════════════════════════════════════════════════════════════════════
  // USERS  ← endpoints جديدة للمستخدمين
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * GET /api/dashboard/users
   * Query: page, limit, search, isVerified (true|false)
   */
  @Get('users')
  getUsers(
    @Query('page')       page       = '1',
    @Query('limit')      limit      = '15',
    @Query('search')     search     = '',
    @Query('isVerified') isVerified?: string,
  ) {
    const verified = isVerified === 'true' ? true : isVerified === 'false' ? false : undefined;
    return this.svc.getUsers(+page, +limit, search, verified);
  }

  /**
   * GET /api/dashboard/users/:id
   */
  @Get('users/:id')
  getUserById(@Param('id', ParseIntPipe) id: number) {
    return this.svc.getUserById(id);
  }

  /**
   * POST /api/dashboard/users
   * Body: { name, phone, isVerified? }
   * ملاحظة: إنشاء المستخدم من الداشبورد لا يُرسل OTP تلقائياً
   * لإرسال OTP استخدم POST /api/dashboard/users/:id/send-otp
   */
  @Post('users')
  @HttpCode(HttpStatus.CREATED)
  createUser(@Body() body: { name: string; phone: string; isVerified?: boolean }) {
    return this.svc.createUser(body);
  }

  /**
   * PUT /api/dashboard/users/:id
   * Body: { name?, phone?, isVerified? }
   */
  @Put('users/:id')
  updateUser(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.svc.updateUser(id, body);
  }

  /**
   * DELETE /api/dashboard/users/:id
   */
  @Delete('users/:id')
  deleteUser(@Param('id', ParseIntPipe) id: number) {
    return this.svc.deleteUser(id);
  }

  /**
   * POST /api/dashboard/users/:id/send-otp
   * يُرسل OTP للمستخدم عبر AuthService
   */
  @Post('users/:id/send-otp')
  @HttpCode(HttpStatus.OK)
  async sendOtpToUser(@Param('id', ParseIntPipe) id: number) {
    const user = await this.svc.getUserById(id);
    // نستدعي auth endpoint مباشرة
    const res = await fetch(`http://localhost:${process.env.PORT ?? 3000}/auth/send-otp`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ phone: user.phone, method: 'sms' }),
    });
    const json = await res.json();
    if (!res.ok) throw new HttpException(json, res.status);
    return json;
  }
}