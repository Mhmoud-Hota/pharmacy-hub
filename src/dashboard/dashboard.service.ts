// src/dashboard/dashboard.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  // ══════════════════════════════════════════════════════════
  // STATS
  // ══════════════════════════════════════════════════════════
  async getStats() {
    const [
      totalPharmacies,
      activePharmacies,
      totalMedicines,
      totalStockItems,
      lowStockCount,
      recentLogs,
      topMedicines,
    ] = await Promise.all([
      this.prisma.pharmacy.count(),
      this.prisma.pharmacy.count({ where: { isActive: true } }),
      this.prisma.masterMedicine.count(),
      this.prisma.pharmacyStock.aggregate({ _sum: { quantity: true } }),
      this.prisma.pharmacyStock.count({ where: { quantity: { lte: 10, gt: 0 } } }),
      this.prisma.webhookLog.count({ where: { createdAt: { gte: new Date(Date.now() - 86400000) } } }),
      this.prisma.masterMedicine.findMany({
        take: 5,
        include: { stocks: { select: { quantity: true } } },
        orderBy: { stocks: { _count: 'desc' } },
      }),
    ]);

    return {
      pharmacies:   { total: totalPharmacies, active: activePharmacies },
      medicines:    { total: totalMedicines },
      stock:        { total_units: totalStockItems._sum.quantity ?? 0, low_stock: lowStockCount },
      webhooks_24h: recentLogs,
      top_medicines: topMedicines.map(m => ({
        id:           m.id,
        name:         m.canonicalName,
        available_in: m.stocks.length,
        total_qty:    m.stocks.reduce((s, x) => s + x.quantity, 0),
      })),
    };
  }

  // ══════════════════════════════════════════════════════════
  // PHARMACIES
  // ══════════════════════════════════════════════════════════
  async getPharmacies() {
    return this.prisma.pharmacy.findMany({
      include: {
        _count: { select: { stocks: true, webhookLogs: true } },
        stocks: { select: { quantity: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPharmacyDetail(id: number) {
    return this.prisma.pharmacy.findUnique({
      where: { id },
      include: {
        stocks: { include: { masterMedicine: true }, orderBy: { quantity: 'desc' }, take: 50 },
        webhookLogs: { orderBy: { createdAt: 'desc' }, take: 20, select: { id: true, eventType: true, status: true, createdAt: true, errorMsg: true } },
      },
    });
  }

  async createPharmacy(data: {
    name: string; slug: string; address?: string;
    city?: string; phone?: string; workingHours?: string;
    latitude?: number; longitude?: number;
  }) {
    const crypto = await import('crypto');
    const apiKey        = crypto.randomBytes(32).toString('hex');
    const webhookSecret = crypto.randomBytes(32).toString('hex');
    const pharmacy = await this.prisma.pharmacy.create({
      data: { ...data, apiKey, webhookSecret },
    });
    return {
      ...pharmacy,
      api_key:        apiKey,
      webhook_secret: webhookSecret,
      webhook_url:    `/webhooks/${pharmacy.slug}`,
    };
  }

  async updatePharmacy(id: number, data: {
    name?: string; address?: string; city?: string; phone?: string;
    workingHours?: string; latitude?: number; longitude?: number; isActive?: boolean;
  }) {
    return this.prisma.pharmacy.update({ where: { id }, data });
  }

  async togglePharmacy(id: number, active: boolean) {
    return this.prisma.pharmacy.update({ where: { id }, data: { isActive: active } });
  }

  async regenerateApiKey(id: number) {
    const crypto = await import('crypto');
    const apiKey = crypto.randomBytes(32).toString('hex');
    await this.prisma.pharmacy.update({ where: { id }, data: { apiKey } });
    return { apiKey };
  }

  async getPharmacyStats(id: number) {
    const [stock, lowStock, expiringSoon, recentEvents] = await Promise.all([
      this.prisma.pharmacyStock.aggregate({
        where: { pharmacyId: id },
        _sum: { quantity: true },
        _count: true,
      }),
      this.prisma.pharmacyStock.count({ where: { pharmacyId: id, quantity: { lte: 10, gt: 0 } } }),
      this.prisma.pharmacyStock.count({
        where: { pharmacyId: id, expiryDate: { lte: new Date(Date.now() + 90 * 86400000) } },
      }),
      this.prisma.webhookLog.findMany({
        where: { pharmacyId: id },
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: { eventType: true, status: true, createdAt: true },
      }),
    ]);
    return {
      total_items:   stock._count,
      total_units:   stock._sum.quantity ?? 0,
      low_stock:     lowStock,
      expiring_soon: expiringSoon,
      recent_events: recentEvents,
    };
  }

  // ══════════════════════════════════════════════════════════
  // MEDICINES
  // ══════════════════════════════════════════════════════════
  async getMedicines(page = 1, limit = 50, search = '', category = '') {
    const where: any = {};
    if (search) {
      where.OR = [
        { canonicalName:  { contains: search } },
        { scientificName: { contains: search } },
        { barcode:        { contains: search } },
      ];
    }
    if (category) where.category = category;

    const [items, total] = await Promise.all([
      this.prisma.masterMedicine.findMany({
        where,
        skip:  (page - 1) * limit,
        take:  limit,
        include: { stocks: { include: { pharmacy: { select: { id: true, name: true } } } } },
        orderBy: { canonicalName: 'asc' },
      }),
      this.prisma.masterMedicine.count({ where }),
    ]);

    return {
      data: items.map(m => ({
        ...m,
        total_qty:    m.stocks.reduce((s, x) => s + x.quantity, 0),
        available_in: m.stocks.filter(x => x.quantity > 0).length,
      })),
      total,
      page,
      total_pages: Math.ceil(total / limit),
    };
  }

  // ══════════════════════════════════════════════════════════
  // WEBHOOK LOGS
  // ══════════════════════════════════════════════════════════
  async getWebhookLogs(page = 1, pharmacyId?: number, status?: string) {
    const where: any = {};
    if (pharmacyId) where.pharmacyId = pharmacyId;
    if (status)     where.status     = status;

    const [logs, total] = await Promise.all([
      this.prisma.webhookLog.findMany({
        where,
        skip: (page - 1) * 30,
        take: 30,
        include: { pharmacy: { select: { name: true, slug: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.webhookLog.count({ where }),
    ]);
    return { logs, total, page };
  }

  // ══════════════════════════════════════════════════════════
  // USERS  ← جديد
  // ══════════════════════════════════════════════════════════
  async getUsers(page = 1, limit = 15, search = '', isVerified?: boolean) {
    const where: any = {};
    if (search) {
      where.OR = [
        { name:  { contains: search } },
        { phone: { contains: search } },
      ];
    }
    if (isVerified !== undefined) where.isVerified = isVerified;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [data, total, verified_count, new_today] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip:    (page - 1) * limit,
        take:    limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
      this.prisma.user.count({ where: { isVerified: true } }),
      this.prisma.user.count({ where: { createdAt: { gte: today } } }),
    ]);

    return {
      data,
      total,
      page,
      total_pages:      Math.ceil(total / limit),
      verified_count,
      unverified_count: total - verified_count,
      new_today,
    };
  }

  async getUserById(id: number) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('المستخدم غير موجود');
    return user;
  }

  async createUser(data: { 
  name: string; 
  phone: string; 
  isVerified?: boolean;
  password?: string;  // ← اختياري من Dashboard
}) {
  const bcrypt = await import('bcrypt');
  
  // لو لم يُرسل password من Dashboard، نولّد كلمة مرور عشوائية
  const rawPassword = data.password ?? Math.random().toString(36).slice(-8);
  const hashed      = await bcrypt.hash(rawPassword, 10);

  return this.prisma.user.create({ 
    data: {
      name:       data.name,
      phone:      data.phone,
      password:   hashed,
      isVerified: data.isVerified ?? false,
    },
  });
}

  async updateUser(id: number, data: { name?: string; phone?: string; isVerified?: boolean }) {
    return this.prisma.user.update({ where: { id }, data });
  }

  async deleteUser(id: number) {
    await this.prisma.user.delete({ where: { id } });
    return { success: true };
  }
}