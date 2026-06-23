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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const auth_service_1 = require("./auth.service");
const jwt_auth_guard_1 = require("./guards/jwt-auth.guard");
const auth_dto_1 = require("./dto/auth.dto");
let AuthController = class AuthController {
    constructor(authService) {
        this.authService = authService;
    }
    register(dto) {
        return this.authService.register(dto);
    }
    login(dto) {
        return this.authService.login(dto);
    }
    refreshToken(dto) {
        return this.authService.refreshToken(dto);
    }
    sendOtp(dto) {
        return this.authService.sendOtp(dto);
    }
    verifyOtp(dto) {
        return this.authService.verifyOtp(dto);
    }
    forgotPassword(dto) {
        return this.authService.forgotPassword(dto);
    }
    resetPassword(dto) {
        return this.authService.resetPassword(dto);
    }
    getMe(req) {
        return this.authService.getMe(req.user.sub);
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Post)('register'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'تسجيل مستخدم جديد', description: 'ينشئ حساباً ويُرسل OTP تلقائياً' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'تم الإنشاء وإرسال OTP', schema: { example: { success: true, message: 'تم إنشاء الحساب، أدخل رمز OTP للتحقق', user_id: 1 } } }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'رقم الهاتف مسجّل مسبقاً' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_dto_1.RegisterDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "register", null);
__decorate([
    (0, common_1.Post)('login'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'تسجيل الدخول | Login', description: 'يتحقق من بيانات المستخدم ويُرجع Access Token و Refresh Token' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'تم تسجيل الدخول بنجاح', schema: { example: { statusCode: 200, path: '/auth/login', timestamp: '2026-06-21T08:00:00.000Z', success: true, access_token: 'eyJ...', refresh_token: 'eyJ...', token_type: 'Bearer', user: { id: 1, name: 'محمود أحمد', phone: '+249912345678', profile_image: null, is_verified: true, created_at: '2026-01-01T00:00:00.000Z' } } } }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'فشل المصادقة (كلمة مرور خاطئة أو حساب غير مفعل)', schema: { example: { statusCode: 401, message: 'كلمة المرور غير صحيحة', timestamp: '2026-06-21T08:00:00.000Z', path: '/auth/login' } } }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'المستخدم غير موجود', schema: { example: { statusCode: 404, message: 'لا يوجد حساب بهذا الرقم', timestamp: '2026-06-21T08:00:00.000Z', path: '/auth/login' } } }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_dto_1.LoginDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "login", null);
__decorate([
    (0, common_1.Post)('refresh-token'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'تجديد التوكن | Refresh Token', description: 'يستخدم Refresh Token صالح للحصول على Access Token جديد' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'تم تجديد التوكن بنجاح', schema: { example: { statusCode: 200, path: '/auth/refresh-token', timestamp: '2026-06-21T08:00:00.000Z', success: true, access_token: 'eyJ...', refresh_token: 'eyJ...', token_type: 'Bearer' } } }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Refresh Token غير صالح أو منتهي الصلاحية', schema: { example: { statusCode: 401, message: 'Refresh Token غير صالح أو منتهي', timestamp: '2026-06-21T08:00:00.000Z', path: '/auth/refresh-token' } } }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_dto_1.RefreshTokenDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "refreshToken", null);
__decorate([
    (0, common_1.Post)('send-otp'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'إرسال OTP', description: 'يُرسل رمز OTP لرقم الهاتف' }),
    (0, swagger_1.ApiResponse)({ status: 200, schema: { example: { success: true, message: 'تم إرسال رمز التحقق' } } }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'لا يوجد حساب بهذا الرقم' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_dto_1.SendOtpDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "sendOtp", null);
__decorate([
    (0, common_1.Post)('verify-otp'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'التحقق من رمز OTP | Verify OTP', description: 'يتحقق من الرمز المرسل للهاتف، يُفعّل الحساب، ويُرجع توكنات الدخول' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'تم التحقق بنجاح', schema: { example: { statusCode: 200, path: '/auth/verify-otp', timestamp: '2026-06-21T08:00:00.000Z', success: true, access_token: 'eyJ...', refresh_token: 'eyJ...', token_type: 'Bearer', user: { id: 1, name: 'محمود أحمد', phone: '+249912345678', is_verified: true } } } }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'رمز التحقق غير صحيح أو منتهي', schema: { example: { statusCode: 401, message: 'رمز التحقق غير صحيح أو منتهي الصلاحية', timestamp: '2026-06-21T08:00:00.000Z', path: '/auth/verify-otp' } } }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_dto_1.VerifyOtpDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "verifyOtp", null);
__decorate([
    (0, common_1.Post)('forgot-password'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'نسيت كلمة المرور', description: 'يُرسل OTP لإعادة التعيين' }),
    (0, swagger_1.ApiResponse)({ status: 200, schema: { example: { success: true, message: 'تم إرسال رمز إعادة التعيين' } } }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'لا يوجد حساب بهذا الرقم' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_dto_1.SendOtpDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "forgotPassword", null);
__decorate([
    (0, common_1.Post)('reset-password'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'إعادة تعيين كلمة المرور', description: 'يتحقق من OTP ويحدّث كلمة المرور' }),
    (0, swagger_1.ApiResponse)({ status: 200, schema: { example: { success: true, message: 'تم تغيير كلمة المرور بنجاح' } } }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'رمز OTP خاطئ أو منتهي الصلاحية' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_dto_1.ResetPasswordDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "resetPassword", null);
__decorate([
    (0, common_1.Get)('me'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, swagger_1.ApiOperation)({ summary: 'بيانات المستخدم الحالي', description: 'يتطلب Bearer Token' }),
    (0, swagger_1.ApiResponse)({ status: 200, schema: { example: { id: 1, name: 'محمود', phone: '+249912345678', profile_image: null, is_verified: true, created_at: '2026-01-01T00:00:00.000Z' } } }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Token مفقود أو منتهي' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "getMe", null);
exports.AuthController = AuthController = __decorate([
    (0, swagger_1.ApiTags)('Auth'),
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map