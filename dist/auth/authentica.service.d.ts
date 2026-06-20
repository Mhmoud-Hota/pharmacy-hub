import { ConfigService } from '@nestjs/config';
import { OtpMethod } from './dto/auth.dto';
export declare class AuthenticaService {
    private readonly config;
    private readonly logger;
    private readonly apiUsername;
    private readonly apiPassword;
    private readonly senderName;
    private readonly apiUrl;
    private readonly otpStore;
    private readonly devMode;
    constructor(config: ConfigService);
    sendOtp(phone: string, method?: OtpMethod): Promise<void>;
    verifyOtp(phone: string, otp: string): Promise<boolean>;
    private generateOtp;
    private mapApiError;
}
