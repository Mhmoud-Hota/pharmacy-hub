import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../database/prisma.service';
import { AuthenticaService } from './authentica.service';
import { RegisterDto, SendOtpDto, VerifyOtpDto } from './dto/auth.dto';
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
    sendLoginOtp(dto: SendOtpDto): Promise<{
        success: boolean;
        message: string;
    }>;
    verifyAndLogin(dto: VerifyOtpDto): Promise<{
        success: boolean;
        access_token: string;
        token_type: string;
        user: {
            id: number;
            name: string;
            phone: string;
            is_verified: boolean;
        };
    }>;
    getMe(userId: number): Promise<{
        id: number;
        name: string;
        phone: string;
        is_verified: boolean;
        created_at: Date;
    }>;
}
