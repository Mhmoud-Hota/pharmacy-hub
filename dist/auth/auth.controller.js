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
    sendOtp(dto) {
        return this.authService.sendLoginOtp(dto);
    }
    verifyOtp(dto) {
        return this.authService.verifyAndLogin(dto);
    }
    getMe(req) {
        return this.authService.getMe(req.user.sub);
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Post)('register'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiConsumes)('application/json'),
    (0, swagger_1.ApiOperation)({
        summary: 'تسجيل مستخدم جديد',
        description: `
      ينشئ حساباً جديداً ويُرسل OTP للتحقق.

      **مثال الـ Body:**
      \`\`\`json
      {
        "name": "محمود أحمد",
        "phone": "+249912345678",
        "method": "sms"
      }
      \`\`\`

      بعد استلام الكود استخدم \`POST /auth/verify-otp\`
    `,
    }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'تم الإنشاء وإرسال OTP' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'بيانات غير صحيحة' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'رقم الهاتف مسجّل مسبقاً' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_dto_1.RegisterDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "register", null);
__decorate([
    (0, common_1.Post)('send-otp'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiConsumes)('application/json'),
    (0, swagger_1.ApiOperation)({
        summary: 'إرسال OTP لتسجيل الدخول',
        description: `
      يُرسل رمز OTP لرقم الهاتف.

      **مثال الـ Body:**
      \`\`\`json
      {
        "phone": "+249912345678",
        "method": "sms"
      }
      \`\`\`
    `,
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'تم إرسال OTP' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'المستخدم غير موجود' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_dto_1.SendOtpDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "sendOtp", null);
__decorate([
    (0, common_1.Post)('verify-otp'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiConsumes)('application/json'),
    (0, swagger_1.ApiOperation)({
        summary: 'التحقق من OTP والحصول على JWT Token',
        description: `
      **مثال الـ Body:**
      \`\`\`json
      {
        "phone": "+249912345678",
        "otp": "123456"
      }
      \`\`\`

      يُعيد \`access_token\` استخدمه في Header:
      \`Authorization: Bearer <token>\`
    `,
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        schema: {
            example: {
                success: true,
                access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                token_type: 'Bearer',
                user: { id: 1, name: 'محمود', phone: '+249912345678', is_verified: true },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'رمز OTP خاطئ أو منتهي' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_dto_1.VerifyOtpDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "verifyOtp", null);
__decorate([
    (0, common_1.Get)('me'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, swagger_1.ApiOperation)({ summary: 'بيانات المستخدم الحالي (يتطلب Bearer Token)' }),
    (0, swagger_1.ApiResponse)({ status: 200 }),
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