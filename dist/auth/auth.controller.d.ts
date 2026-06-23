import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, SendOtpDto, VerifyOtpDto, ResetPasswordDto, RefreshTokenDto } from './dto/auth.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
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
    refreshToken(dto: RefreshTokenDto): Promise<{
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
    getMe(req: {
        user: {
            sub: number;
        };
    }): Promise<{
        id: any;
        name: any;
        phone: any;
        profile_image: any;
        is_verified: any;
        created_at: any;
    }>;
}
