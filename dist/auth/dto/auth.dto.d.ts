export declare enum OtpMethod {
    SMS = "sms",
    WHATSAPP = "whatsapp",
    EMAIL = "email"
}
export declare class RegisterDto {
    name: string;
    phone: string;
    method?: OtpMethod;
}
export declare class SendOtpDto {
    phone: string;
    method?: OtpMethod;
}
export declare class VerifyOtpDto {
    phone: string;
    otp: string;
}
