import { AuthService } from './auth.service';
import { RegisterDto, SendOtpDto, VerifyOtpDto } from './dto/auth.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(dto: RegisterDto): Promise<{
        success: boolean;
        message: string;
        user_id: number;
    }>;
    sendOtp(dto: SendOtpDto): Promise<{
        success: boolean;
        message: string;
    }>;
    verifyOtp(dto: VerifyOtpDto): Promise<{
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
    getMe(req: {
        user: {
            sub: number;
        };
    }): Promise<{
        id: number;
        name: string;
        phone: string;
        is_verified: boolean;
        created_at: Date;
    }>;
}
