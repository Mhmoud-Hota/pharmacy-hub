// src/auth/authentica.service.ts
import {
  Injectable, Logger,
  ServiceUnavailableException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OtpMethod } from './dto/auth.dto';

@Injectable()
export class AuthenticaService {
  private readonly logger = new Logger(AuthenticaService.name);

  // ── بيانات EasySendSMS ────────────────────────────────────────────────────
  private readonly apiUsername: string;
  private readonly apiPassword: string;
  private readonly senderName: string;
  private readonly apiUrl = 'https://api.easysendsms.app/bulksms';

  // ── مخزن OTP (يُستخدم دائماً لأن EasySendSMS لا تدير OTP بنفسها) ─────────
  private readonly otpStore = new Map<string, { otp: string; expiresAt: number }>();

  // ── وضع التطوير (يطبع OTP بدلاً من إرساله) ───────────────────────────────
  private readonly devMode: boolean;

  constructor(private readonly config: ConfigService) {
    this.devMode     = config.get<string>('OTP_DEV_MODE') === 'true';
    this.apiUsername = config.getOrThrow<string>('EASYSENDSMS_USERNAME');
    this.apiPassword = config.getOrThrow<string>('EASYSENDSMS_PASSWORD');
    this.senderName  = config.get<string>('EASYSENDSMS_SENDER') ?? 'MyApp';

    if (this.devMode) {
      this.logger.warn(
        '⚠️  OTP_DEV_MODE=true — الكود يُطبع في الـ console بدلاً من الإرسال (للتطوير فقط)',
      );
    }
  }

  // ── إرسال OTP ──────────────────────────────────────────────────────────────
  async sendOtp(phone: string, method: OtpMethod = OtpMethod.SMS): Promise<void> {
    const otp = this.generateOtp();

    // احفظ OTP دائماً (نحن من يديره لأن EasySendSMS خدمة إرسال فقط)
    this.otpStore.set(phone, {
      otp,
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 دقائق
    });

    // ── وضع التطوير ───────────────────────────────────────────────────────────
    if (this.devMode) {
      this.logger.warn(`🔑 [DEV] OTP للرقم ${phone} → ${otp}  (ينتهي بعد 10 دقائق)`);
      return;
    }

    // ── وضع الإنتاج: إرسال عبر EasySendSMS ──────────────────────────────────
    // ملاحظة: EasySendSMS لا تدعم WhatsApp، كلا الوضعين يُرسل SMS
    if (method === OtpMethod.WHATSAPP) {
      this.logger.warn(`[EasySendSMS] WhatsApp غير مدعوم، سيُرسل SMS بدلاً منه`);
    }

    const message = `رمز التحقق الخاص بك: ${otp}\nصالح لمدة 10 دقائق.`;

    // رقم الهاتف يجب أن يكون بدون + أو 00
    const normalizedPhone = phone.replace(/^\+/, '').replace(/^00/, '');

    const params = new URLSearchParams({
      username: this.apiUsername,
      password: this.apiPassword,
      from:     this.senderName,
      to:       normalizedPhone,
      text:     message,
      type:     '1', // Unicode لدعم العربية
    });

    this.logger.log(`[EasySendSMS] Sending OTP → ${phone}`);

    let responseText: string;
    try {
      const response = await fetch(this.apiUrl, {
        method:  'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body:    params.toString(),
      });
      responseText = await response.text();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`[EasySendSMS] Network error: ${msg}`);
      throw new ServiceUnavailableException('فشل إرسال رمز التحقق — خطأ في الشبكة');
    }

    this.logger.log(`[EasySendSMS] Response: ${responseText}`);

    if (!responseText.startsWith('OK')) {
      const errorCode = responseText.trim();
      this.logger.error(`[EasySendSMS] Send failed → ${errorCode}`);
      throw this.mapApiError(errorCode, phone);
    }

    this.logger.log(`[EasySendSMS] ✅ OTP sent → ${phone}`);
  }

  // ── التحقق من OTP ───────────────────────────────────────────────────────────
  async verifyOtp(phone: string, otp: string): Promise<boolean> {
    const stored = this.otpStore.get(phone);

    if (!stored) {
      this.logger.warn(`[OTP] لا يوجد OTP مخزّن للرقم ${phone}`);
      return false;
    }

    if (Date.now() > stored.expiresAt) {
      this.otpStore.delete(phone);
      this.logger.warn(`[OTP] منتهي الصلاحية للرقم ${phone}`);
      return false;
    }

    const valid = stored.otp === otp.trim();
    if (valid) this.otpStore.delete(phone); // استخدم مرة واحدة فقط

    this.logger.log(`[OTP] Verify للرقم ${phone}: ${valid ? '✅ صحيح' : '❌ خاطئ'}`);
    return valid;
  }

  // ── توليد OTP عشوائي ────────────────────────────────────────────────────────
  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // ── ترجمة أكواد خطأ EasySendSMS ─────────────────────────────────────────────
  private mapApiError(code: string, phone: string): Error {
    const errors: Record<string, string> = {
      '1001': 'خطأ في إعدادات API — أحد المعاملات مفقود أو فارغ',
      '1002': 'بيانات اعتماد EasySendSMS غير صحيحة (username/password)',
      '1003': 'نوع الرسالة غير صالح',
      '1004': 'نص الرسالة غير صالح',
      '1005': `رقم الهاتف غير مقبول: ${phone}`,
      '1006': `اسم المرسل غير مقبول: ${this.senderName}`,
      '1007': 'رصيد EasySendSMS غير كافٍ — يرجى شحن الحساب',
      '1008': 'خطأ داخلي في EasySendSMS — لا تُعد الإرسال',
      '1009': 'خدمة EasySendSMS غير متاحة حالياً — لا تُعد الإرسال',
    };

    const message = errors[code] ?? `خطأ غير معروف من EasySendSMS (كود: ${code})`;

    if (['1005', '1006', '1003', '1004'].includes(code)) {
      return new BadRequestException(message);
    }
    return new ServiceUnavailableException(message);
  }
}