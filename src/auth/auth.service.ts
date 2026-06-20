// src/auth/auth.service.ts
import {
  Injectable, Logger,
  ConflictException, NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService }        from '@nestjs/jwt';
import { PrismaService }     from '../database/prisma.service';
import { AuthenticaService } from './authentica.service';
import { RegisterDto, SendOtpDto, VerifyOtpDto, OtpMethod } from './dto/auth.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma:     PrismaService,
    private readonly authentica: AuthenticaService,
    private readonly jwt:        JwtService,
  ) {}

  // ── 1. تسجيل مستخدم جديد + إرسال OTP ──────────────────────────────────────
  async register(dto: RegisterDto) {
    const exists = await this.prisma.user.findUnique({
      where: { phone: dto.phone },
    });

    if (exists) {
      throw new ConflictException(
        'رقم الهاتف مسجّل مسبقاً، يمكنك تسجيل الدخول مباشرةً',
      );
    }

    const user = await this.prisma.user.create({
      data: {
        name:       dto.name,
        phone:      dto.phone,
        isVerified: false,
      },
    });

    await this.authentica.sendOtp(dto.phone, dto.method ?? OtpMethod.SMS);

    this.logger.log(`[Register] User created #${user.id} → ${dto.phone}`);

    return {
      success: true,
      message: 'تم إنشاء الحساب. تحقق من رمز OTP المُرسَل لإتمام التسجيل.',
      user_id: user.id,
    };
  }

  // ── 2. إرسال OTP لمستخدم موجود ────────────────────────────────────────────
  async sendLoginOtp(dto: SendOtpDto) {
    const user = await this.prisma.user.findUnique({
      where: { phone: dto.phone },
    });

    if (!user) {
      throw new NotFoundException(
        'لا يوجد حساب بهذا الرقم، يرجى التسجيل أولاً',
      );
    }

    await this.authentica.sendOtp(dto.phone, dto.method ?? OtpMethod.SMS);

    return {
      success: true,
      message: 'تم إرسال رمز التحقق',
    };
  }

  // ── 3. التحقق من OTP وإصدار JWT ────────────────────────────────────────────
  async verifyAndLogin(dto: VerifyOtpDto) {
    const user = await this.prisma.user.findUnique({
      where: { phone: dto.phone },
    });

    if (!user) {
      throw new NotFoundException('لا يوجد حساب بهذا الرقم');
    }

    const isValid = await this.authentica.verifyOtp(dto.phone, dto.otp);
    if (!isValid) {
      throw new UnauthorizedException(
        'رمز التحقق غير صحيح أو منتهي الصلاحية',
      );
    }

    if (!user.isVerified) {
      await this.prisma.user.update({
        where: { id: user.id },
        data:  { isVerified: true },
      });
    }

    const payload = { sub: user.id, phone: user.phone, name: user.name };
    const token   = this.jwt.sign(payload);

    this.logger.log(`[Login] User #${user.id} authenticated`);

    return {
      success:      true,
      access_token: token,
      token_type:   'Bearer',
      user: {
        id:          user.id,
        name:        user.name,
        phone:       user.phone,
        is_verified: true,
      },
    };
  }

  // ── 4. بيانات المستخدم الحالي ───────────────────────────────────────────────
  async getMe(userId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('المستخدم غير موجود');

    return {
      id:          user.id,
      name:        user.name,
      phone:       user.phone,
      is_verified: user.isVerified,
      created_at:  user.createdAt,
    };
  }
}