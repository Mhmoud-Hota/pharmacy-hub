"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AuthenticaService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthenticaService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const auth_dto_1 = require("./dto/auth.dto");
let AuthenticaService = AuthenticaService_1 = class AuthenticaService {
    constructor(config) {
        this.config = config;
        this.logger = new common_1.Logger(AuthenticaService_1.name);
        this.apiUrl = 'https://api.easysendsms.app/bulksms';
        this.otpStore = new Map();
        this.devMode = config.get('OTP_DEV_MODE') === 'true';
        this.apiUsername = config.getOrThrow('EASYSENDSMS_USERNAME');
        this.apiPassword = config.getOrThrow('EASYSENDSMS_PASSWORD');
        this.senderName = config.get('EASYSENDSMS_SENDER') ?? 'MyApp';
        if (this.devMode) {
            this.logger.warn('⚠️  OTP_DEV_MODE=true — الكود يُطبع في الـ console بدلاً من الإرسال (للتطوير فقط)');
        }
    }
    async sendOtp(phone, method = auth_dto_1.OtpMethod.SMS) {
        const otp = this.generateOtp();
        this.otpStore.set(phone, {
            otp,
            expiresAt: Date.now() + 10 * 60 * 1000,
        });
        if (this.devMode) {
            this.logger.warn(`🔑 [DEV] OTP للرقم ${phone} → ${otp}  (ينتهي بعد 10 دقائق)`);
            return;
        }
        if (method === auth_dto_1.OtpMethod.WHATSAPP) {
            this.logger.warn(`[EasySendSMS] WhatsApp غير مدعوم، سيُرسل SMS بدلاً منه`);
        }
        const message = `رمز التحقق الخاص بك: ${otp}\nصالح لمدة 10 دقائق.`;
        const normalizedPhone = phone.replace(/^\+/, '').replace(/^00/, '');
        const params = new URLSearchParams({
            username: this.apiUsername,
            password: this.apiPassword,
            from: this.senderName,
            to: normalizedPhone,
            text: message,
            type: '1',
        });
        this.logger.log(`[EasySendSMS] Sending OTP → ${phone}`);
        let responseText;
        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: params.toString(),
            });
            responseText = await response.text();
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            this.logger.error(`[EasySendSMS] Network error: ${msg}`);
            throw new common_1.ServiceUnavailableException('فشل إرسال رمز التحقق — خطأ في الشبكة');
        }
        this.logger.log(`[EasySendSMS] Response: ${responseText}`);
        if (!responseText.startsWith('OK')) {
            const errorCode = responseText.trim();
            this.logger.error(`[EasySendSMS] Send failed → ${errorCode}`);
            throw this.mapApiError(errorCode, phone);
        }
        this.logger.log(`[EasySendSMS] ✅ OTP sent → ${phone}`);
    }
    async verifyOtp(phone, otp) {
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
        if (valid)
            this.otpStore.delete(phone);
        this.logger.log(`[OTP] Verify للرقم ${phone}: ${valid ? '✅ صحيح' : '❌ خاطئ'}`);
        return valid;
    }
    generateOtp() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }
    mapApiError(code, phone) {
        const errors = {
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
            return new common_1.BadRequestException(message);
        }
        return new common_1.ServiceUnavailableException(message);
    }
};
exports.AuthenticaService = AuthenticaService;
exports.AuthenticaService = AuthenticaService = AuthenticaService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], AuthenticaService);
//# sourceMappingURL=authentica.service.js.map