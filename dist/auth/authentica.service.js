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
const twilio = require('twilio');
let AuthenticaService = AuthenticaService_1 = class AuthenticaService {
    constructor(config) {
        this.config = config;
        this.logger = new common_1.Logger(AuthenticaService_1.name);
        this.devMode = config.get('OTP_DEV_MODE') === 'true';
        const accountSid = config.getOrThrow('TWILIO_ACCOUNT_SID');
        const authToken = config.getOrThrow('TWILIO_AUTH_TOKEN');
        this.verifyServiceSid = config.getOrThrow('TWILIO_VERIFY_SERVICE_SID');
        this.twilioClient = twilio(accountSid, authToken);
        if (this.devMode) {
            this.logger.warn('⚠️  OTP_DEV_MODE=true — OTP يُطبع في الـ console فقط');
        }
    }
    async sendOtp(phone, method = auth_dto_1.OtpMethod.SMS) {
        if (this.devMode) {
            this.logger.warn(`🔑 [DEV] OTP request للرقم ${phone} (لن يُرسل فعلياً)`);
            return;
        }
        const channel = method === auth_dto_1.OtpMethod.WHATSAPP ? 'whatsapp' : 'sms';
        this.logger.log(`[Twilio Verify] Sending OTP → ${phone} via ${channel}`);
        try {
            const verification = await this.twilioClient.verify.v2
                .services(this.verifyServiceSid)
                .verifications
                .create({ to: phone, channel });
            this.logger.log(`[Twilio Verify] ✅ Status: ${verification.status} → ${phone}`);
        }
        catch (err) {
            this.logger.error(`[Twilio Verify] ❌ Error: ${err?.message} (code: ${err?.code})`);
            throw this.mapTwilioError(err);
        }
    }
    async verifyOtp(phone, otp) {
        if (this.devMode) {
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
        }
        catch (err) {
            this.logger.error(`[Twilio Verify] ❌ Check error: ${err?.message} (code: ${err?.code})`);
            if (err?.code === 20404)
                return false;
            throw this.mapTwilioError(err);
        }
    }
    mapTwilioError(err) {
        const code = err?.code;
        const msg = err?.message ?? 'خطأ غير معروف';
        switch (code) {
            case 60200: return new common_1.BadRequestException('رقم الهاتف غير صالح');
            case 60203: return new common_1.BadRequestException('تجاوزت الحد الأقصى لمحاولات الإرسال — انتظر قليلاً');
            case 60212: return new common_1.BadRequestException('رقم الهاتف محظور مؤقتاً بسبب Fraud Guard');
            case 60605: return new common_1.ServiceUnavailableException('إرسال OTP للسودان محظور — تحقق من Geo Permissions في Twilio');
            case 60410: return new common_1.ServiceUnavailableException('تم حظر الإرسال مؤقتاً بواسطة Fraud Guard');
            case 20003: return new common_1.ServiceUnavailableException('بيانات Twilio غير صحيحة (Account SID / Auth Token)');
            default: return new common_1.ServiceUnavailableException(`فشل إرسال رمز التحقق: ${msg}`);
        }
    }
};
exports.AuthenticaService = AuthenticaService;
exports.AuthenticaService = AuthenticaService = AuthenticaService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], AuthenticaService);
//# sourceMappingURL=authentica.service.js.map