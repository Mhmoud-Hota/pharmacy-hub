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
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const prisma_service_1 = require("../database/prisma.service");
const authentica_service_1 = require("./authentica.service");
const auth_dto_1 = require("./dto/auth.dto");
let AuthService = AuthService_1 = class AuthService {
    constructor(prisma, authentica, jwt) {
        this.prisma = prisma;
        this.authentica = authentica;
        this.jwt = jwt;
        this.logger = new common_1.Logger(AuthService_1.name);
    }
    async register(dto) {
        const exists = await this.prisma.user.findUnique({
            where: { phone: dto.phone },
        });
        if (exists) {
            throw new common_1.ConflictException('رقم الهاتف مسجّل مسبقاً، يمكنك تسجيل الدخول مباشرةً');
        }
        const user = await this.prisma.user.create({
            data: {
                name: dto.name,
                phone: dto.phone,
                isVerified: false,
            },
        });
        await this.authentica.sendOtp(dto.phone, dto.method ?? auth_dto_1.OtpMethod.SMS);
        this.logger.log(`[Register] User created #${user.id} → ${dto.phone}`);
        return {
            success: true,
            message: 'تم إنشاء الحساب. تحقق من رمز OTP المُرسَل لإتمام التسجيل.',
            user_id: user.id,
        };
    }
    async sendLoginOtp(dto) {
        const user = await this.prisma.user.findUnique({
            where: { phone: dto.phone },
        });
        if (!user) {
            throw new common_1.NotFoundException('لا يوجد حساب بهذا الرقم، يرجى التسجيل أولاً');
        }
        await this.authentica.sendOtp(dto.phone, dto.method ?? auth_dto_1.OtpMethod.SMS);
        return {
            success: true,
            message: 'تم إرسال رمز التحقق',
        };
    }
    async verifyAndLogin(dto) {
        const user = await this.prisma.user.findUnique({
            where: { phone: dto.phone },
        });
        if (!user) {
            throw new common_1.NotFoundException('لا يوجد حساب بهذا الرقم');
        }
        const isValid = await this.authentica.verifyOtp(dto.phone, dto.otp);
        if (!isValid) {
            throw new common_1.UnauthorizedException('رمز التحقق غير صحيح أو منتهي الصلاحية');
        }
        if (!user.isVerified) {
            await this.prisma.user.update({
                where: { id: user.id },
                data: { isVerified: true },
            });
        }
        const payload = { sub: user.id, phone: user.phone, name: user.name };
        const token = this.jwt.sign(payload);
        this.logger.log(`[Login] User #${user.id} authenticated`);
        return {
            success: true,
            access_token: token,
            token_type: 'Bearer',
            user: {
                id: user.id,
                name: user.name,
                phone: user.phone,
                is_verified: true,
            },
        };
    }
    async getMe(userId) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new common_1.NotFoundException('المستخدم غير موجود');
        return {
            id: user.id,
            name: user.name,
            phone: user.phone,
            is_verified: user.isVerified,
            created_at: user.createdAt,
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        authentica_service_1.AuthenticaService,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map