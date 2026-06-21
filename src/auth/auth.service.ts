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
  VerifyOtpDto, ResetPasswordDto, OtpMethod,
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

    const token = this.jwt.sign({ sub: user.id, phone: user.phone, name: user.name });
    this.logger.log(`[Login] User #${user.id}`);

    return {
      success:      true,
      access_token: token,
      token_type:   'Bearer',
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

    const token = this.jwt.sign({ sub: user.id, phone: user.phone, name: user.name });
    this.logger.log(`[VerifyOTP] User #${user.id}`);

    return {
      success:      true,
      access_token: token,
      token_type:   'Bearer',
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

  // ── Helper ─────────────────────────────────────────────────────────────────
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