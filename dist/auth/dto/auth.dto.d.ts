export declare enum OtpMethod {
    SMS = "sms",
    WHATSAPP = "whatsapp"
}
export declare class RegisterDto {
    name: string;
    phone: string;
    password: string;
    profileImage?: string;
    method?: OtpMethod;
}
export declare class LoginDto {
    phone: string;
    password: string;
}
export declare class SendOtpDto {
    phone: string;
    method?: OtpMethod;
}
export declare class VerifyOtpDto {
    phone: string;
    otp: string;
}
export declare class ResetPasswordDto {
    phone: string;
    otp: string;
    newPassword: string;
}
