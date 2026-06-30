// src/auth/strategies/jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';

// كل كم وقت نسمح بتحديث lastActiveAt لنفس المستخدم (لتجنّب الكتابة على كل طلب)
const ACTIVITY_THROTTLE_MS = 60 * 1000;

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  // ذاكرة مؤقتة (per-instance) لآخر وقت كتبنا فيه نشاط كل مستخدم
  private readonly lastWrite = new Map<number, number>();

  constructor(config: ConfigService, private readonly prisma: PrismaService) {
    super({
      jwtFromRequest:   ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:      config.getOrThrow<string>('JWT_SECRET'),
    });
  }

  // payload يُصبح متاحاً كـ req.user في الـ controllers
  async validate(payload: { sub: number; phone: string; name: string }) {
    if (!payload?.sub) throw new UnauthorizedException();
    this.touchActivity(payload.sub);
    return { sub: payload.sub, phone: payload.phone, name: payload.name };
  }

  // تحديث "آخر نشاط" بدون انتظار (fire-and-forget) ومُقيّد زمنياً
  private touchActivity(userId: number): void {
    const now = Date.now();
    const last = this.lastWrite.get(userId) ?? 0;
    if (now - last < ACTIVITY_THROTTLE_MS) return;

    this.lastWrite.set(userId, now);
    this.prisma.user
      .update({ where: { id: userId }, data: { lastActiveAt: new Date() } })
      .catch(() => {}); // لا نُسقط الطلب لو فشل التحديث
  }
}