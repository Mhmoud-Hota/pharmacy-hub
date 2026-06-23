import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../database/prisma.service';
import { AuthenticaService } from './authentica.service';
import { RegisterDto, LoginDto, SendOtpDto, VerifyOtpDto, ResetPasswordDto, RefreshTokenDto } from './dto/auth.dto';
export declare class AuthService {
    private readonly prisma;
    private readonly authentica;
    private readonly jwt;
    private readonly logger;
    constructor(prisma: PrismaService, authentica: AuthenticaService, jwt: JwtService);
    register(dto: RegisterDto): Promise<{
        success: boolean;
        message: string;
        user_id: number;
    }>;
    login(dto: LoginDto): Promise<{
        user: {
            id: any;
            name: any;
            phone: any;
            profile_image: any;
            is_verified: any;
            created_at: any;
        };
        access_token: string;
        refresh_token: string;
        token_type: string;
        success: boolean;
    }>;
    sendOtp(dto: SendOtpDto): Promise<{
        success: boolean;
        message: string;
    }>;
    verifyOtp(dto: VerifyOtpDto): Promise<{
        user: {
            id: any;
            name: any;
            phone: any;
            profile_image: any;
            is_verified: any;
            created_at: any;
        };
        access_token: string;
        refresh_token: string;
        token_type: string;
        success: boolean;
    }>;
    forgotPassword(dto: SendOtpDto): Promise<{
        success: boolean;
        message: string;
    }>;
    resetPassword(dto: ResetPasswordDto): Promise<{
        success: boolean;
        message: string;
    }>;
    getMe(userId: number): Promise<{
        id: any;
        name: any;
        phone: any;
        profile_image: any;
        is_verified: any;
        created_at: any;
    }>;
    refreshToken(dto: RefreshTokenDto): Promise<{
        access_token: string;
        refresh_token: string;
        token_type: string;
        success: boolean;
    }>;
    private _generateTokens;
    private _formatUser;
}
