// src/auth/auth.service.ts
import {
  Injectable, Logger,
  ConflictException, NotFoundException,
  UnauthorizedException, BadRequestException,
} from '@nestjs/common';
import { JwtService }        from '@nestjs/jwt';
import { PrismaService }     from '../database/prisma.service';
import { AuthenticaService } from './authentica.service';
import {
  RegisterDto, LoginDto, SendOtpDto,
  VerifyOtpDto, ResetPasswordDto, OtpMethod, RefreshTokenDto,
} from './dto/auth.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma:     PrismaService,
    private readonly authentica: AuthenticaService,
    private readonly jwt:        JwtService,
  ) {}

  // ── 1. تسجيل + إرسال OTP ───────────────────────────────────────────────────
  async register(dto: RegisterDto) {
    const exists = await this.prisma.user.findUnique({ where: { phone: dto.phone } });
    if (exists) {
      throw new ConflictException('رقم الهاتف مسجّل مسبقاً');
    }

    const hashed = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        name:         dto.name,
        phone:        dto.phone,
        password:     hashed,
        profileImage: dto.profileImage ?? null,
        isVerified:   false,
      },
    });

    await this.authentica.sendOtp(dto.phone, dto.method ?? OtpMethod.SMS);
    this.logger.log(`[Register] User #${user.id} → ${dto.phone}`);

    return { success: true, message: 'تم إنشاء الحساب، أدخل رمز OTP للتحقق', user_id: user.id };
  }

  // ── 2. تسجيل الدخول بكلمة مرور ────────────────────────────────────────────
  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { phone: dto.phone } });

    if (!user) throw new NotFoundException('لا يوجد حساب بهذا الرقم');
    if (!user.isVerified) throw new UnauthorizedException('الحساب غير مفعّل، أكمل التحقق من OTP');

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException('كلمة المرور غير صحيحة');

    const tokens = await this._generateTokens(user);
    this.logger.log(`[Login] User #${user.id}`);

    return {
      success:      true,
      ...tokens,
      user: this._formatUser(user),
    };
  }

  // ── 3. إرسال OTP ───────────────────────────────────────────────────────────
  async sendOtp(dto: SendOtpDto) {
    const user = await this.prisma.user.findUnique({ where: { phone: dto.phone } });
    if (!user) throw new NotFoundException('لا يوجد حساب بهذا الرقم');

    await this.authentica.sendOtp(dto.phone, dto.method ?? OtpMethod.SMS);
    return { success: true, message: 'تم إرسال رمز التحقق' };
  }

  // ── 4. التحقق من OTP بعد التسجيل ──────────────────────────────────────────
  async verifyOtp(dto: VerifyOtpDto) {
    const user = await this.prisma.user.findUnique({ where: { phone: dto.phone } });
    if (!user) throw new NotFoundException('لا يوجد حساب بهذا الرقم');

    const isValid = await this.authentica.verifyOtp(dto.phone, dto.otp);
    if (!isValid) throw new UnauthorizedException('رمز التحقق غير صحيح أو منتهي الصلاحية');

    if (!user.isVerified) {
      await this.prisma.user.update({ where: { id: user.id }, data: { isVerified: true } });
    }

    const tokens = await this._generateTokens(user);
    this.logger.log(`[VerifyOTP] User #${user.id}`);

    return {
      success:      true,
      ...tokens,
      user:         this._formatUser({ ...user, isVerified: true }),
    };
  }

  // ── 5. نسيت كلمة المرور — إرسال OTP ──────────────────────────────────────
  async forgotPassword(dto: SendOtpDto) {
    const user = await this.prisma.user.findUnique({ where: { phone: dto.phone } });
    if (!user) throw new NotFoundException('لا يوجد حساب بهذا الرقم');

    await this.authentica.sendOtp(dto.phone, OtpMethod.SMS);
    return { success: true, message: 'تم إرسال رمز إعادة التعيين' };
  }

  // ── 6. إعادة تعيين كلمة المرور ────────────────────────────────────────────
  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { phone: dto.phone } });
    if (!user) throw new NotFoundException('لا يوجد حساب بهذا الرقم');

    const isValid = await this.authentica.verifyOtp(dto.phone, dto.otp);
    if (!isValid) throw new UnauthorizedException('رمز التحقق غير صحيح أو منتهي الصلاحية');

    const hashed = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({ where: { id: user.id }, data: { password: hashed } });

    return { success: true, message: 'تم تغيير كلمة المرور بنجاح' };
  }

  // ── 7. بيانات المستخدم الحالي ──────────────────────────────────────────────
  async getMe(userId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('المستخدم غير موجود');
    return this._formatUser(user);
  }

  // ── 8. تجديد التوكن (Refresh Token) ─────────────────────────────────────────
  async refreshToken(dto: RefreshTokenDto) {
    try {
      const payload = await this.jwt.verifyAsync(dto.refresh_token, {
        secret: process.env.JWT_REFRESH_SECRET || 'refresh_secret_123',
      });

      const user: any = await this.prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user || user.refreshToken !== dto.refresh_token) {
        throw new UnauthorizedException('Refresh Token غير صالح أو منتهي');
      }

      const tokens = await this._generateTokens(user);
      return { success: true, ...tokens };
    } catch (e) {
      throw new UnauthorizedException('Refresh Token غير صالح أو منتهي');
    }
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────
  private async _generateTokens(user: any) {
    const payload = { sub: user.id, phone: user.phone, name: user.name };
    
    const accessToken = this.jwt.sign(payload);
    const refreshToken = this.jwt.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET || 'refresh_secret_123',
      expiresIn: '7d',
    });

    // تحديث الـ Refresh Token في قاعدة البيانات
    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken } as any,
    });

    return {
      access_token:  accessToken,
      refresh_token: refreshToken,
      token_type:    'Bearer',
    };
  }

  private _formatUser(user: any) {
    return {
      id:           user.id,
      name:         user.name,
      phone:        user.phone,
      profile_image: user.profileImage,
      is_verified:  user.isVerified,
      created_at:   user.createdAt,
    };
  }
}