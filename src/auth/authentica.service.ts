// src/auth/authentica.service.ts
import {
  Injectable, Logger,
  ServiceUnavailableException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OtpMethod } from './dto/auth.dto';
const twilio = require('twilio');



@Injectable()
export class AuthenticaService {
  private readonly logger = new Logger(AuthenticaService.name);

private readonly twilioClient: any;
  private readonly verifyServiceSid: string;
  private readonly devMode: boolean;

  constructor(private readonly config: ConfigService) {
    this.devMode = config.get<string>('OTP_DEV_MODE') === 'true';

    const accountSid  = config.getOrThrow<string>('TWILIO_ACCOUNT_SID');
    const authToken   = config.getOrThrow<string>('TWILIO_AUTH_TOKEN');
    this.verifyServiceSid = config.getOrThrow<string>('TWILIO_VERIFY_SERVICE_SID');

this.twilioClient = twilio(accountSid, authToken);
    if (this.devMode) {
      this.logger.warn('⚠️  OTP_DEV_MODE=true — OTP يُطبع في الـ console فقط');
    }
  }

  // ── إرسال OTP عبر Twilio Verify ──────────────────────────────────────────
  async sendOtp(phone: string, method: OtpMethod = OtpMethod.SMS): Promise<void> {

    // وضع التطوير: طباعة OTP بدون إرسال
    if (this.devMode) {
      this.logger.warn(`🔑 [DEV] OTP request للرقم ${phone} (لن يُرسل فعلياً)`);
      return;
    }

    // Twilio Verify يدعم sms و whatsapp
    const channel = method === OtpMethod.WHATSAPP ? 'whatsapp' : 'sms';

    this.logger.log(`[Twilio Verify] Sending OTP → ${phone} via ${channel}`);

    try {
      const verification = await this.twilioClient.verify.v2
        .services(this.verifyServiceSid)
        .verifications
        .create({ to: phone, channel });

      this.logger.log(`[Twilio Verify] ✅ Status: ${verification.status} → ${phone}`);
    } catch (err: any) {
      this.logger.error(`[Twilio Verify] ❌ Error: ${err?.message} (code: ${err?.code})`);
      throw this.mapTwilioError(err);
    }
  }

  // ── التحقق من OTP عبر Twilio Verify ──────────────────────────────────────
  async verifyOtp(phone: string, otp: string): Promise<boolean> {
    if (this.devMode) {
      // في وضع التطوير: قبول أي OTP مكوّن من 6 أرقام
      const valid = /^\d{6}$/.test(otp.trim());
      this.logger.warn(`🔑 [DEV] OTP verify للرقم ${phone}: ${valid ? '✅' : '❌'}`);
      return valid;
    }

    this.logger.log(`[Twilio Verify] Checking OTP → ${phone}`);

    try {
      const result = await this.twilioClient.verify.v2
        .services(this.verifyServiceSid)
        .verificationChecks
        .create({ to: phone, code: otp.trim() });

      this.logger.log(`[Twilio Verify] Check status: ${result.status} → ${phone}`);
      return result.status === 'approved';
    } catch (err: any) {
      this.logger.error(`[Twilio Verify] ❌ Check error: ${err?.message} (code: ${err?.code})`);
      // 20404 = OTP انتهت صلاحيته أو الرقم غير موجود
      if (err?.code === 20404) return false;
      throw this.mapTwilioError(err);
    }
  }

  // ── ترجمة أخطاء Twilio ────────────────────────────────────────────────────
  private mapTwilioError(err: any): Error {
    const code = err?.code;
    const msg  = err?.message ?? 'خطأ غير معروف';

    switch (code) {
      case 60200: return new BadRequestException('رقم الهاتف غير صالح');
      case 60203: return new BadRequestException('تجاوزت الحد الأقصى لمحاولات الإرسال — انتظر قليلاً');
      case 60212: return new BadRequestException('رقم الهاتف محظور مؤقتاً بسبب Fraud Guard');
      case 60605: return new ServiceUnavailableException('إرسال OTP للسودان محظور — تحقق من Geo Permissions في Twilio');
      case 60410: return new ServiceUnavailableException('تم حظر الإرسال مؤقتاً بواسطة Fraud Guard');
      case 20003: return new ServiceUnavailableException('بيانات Twilio غير صحيحة (Account SID / Auth Token)');
      default:    return new ServiceUnavailableException(`فشل إرسال رمز التحقق: ${msg}`);
    }
  }
}