// src/auth/dto/auth.dto.ts
import {
  IsString, IsOptional, IsEnum,
  Matches, MinLength, MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum OtpMethod {
  SMS      = 'sms',
  WHATSAPP = 'whatsapp',
  EMAIL    = 'email',
}

// ─── تسجيل مستخدم جديد ──────────────────────────────────────────────────────
export class RegisterDto {
  @ApiProperty({ example: 'محمود أحمد', description: 'الاسم الكامل' })
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  name: string;

  @ApiProperty({
    example: '+966551234567',
    description: 'رقم الهاتف بالصيغة الدولية',
  })
  @IsString()
  @Matches(/^\+[1-9]\d{1,14}$/, {
    message: 'رقم الهاتف غير صحيح، يجب أن يكون بصيغة دولية مثل +966551234567',
  })
  phone: string;

  @ApiProperty({
    example: 'sms',
    enum: OtpMethod,
    required: false,
    description: 'طريقة استلام OTP (افتراضي: sms)',
  })
  @IsOptional()
  @IsEnum(OtpMethod)
  method?: OtpMethod;
}

// ─── إرسال OTP (تسجيل الدخول) ──────────────────────────────────────────────
export class SendOtpDto {
  @ApiProperty({ example: '+966551234567' })
  @IsString()
  @Matches(/^\+[1-9]\d{1,14}$/, { message: 'رقم الهاتف غير صحيح' })
  phone: string;

  @ApiProperty({ example: 'sms', enum: OtpMethod, required: false })
  @IsOptional()
  @IsEnum(OtpMethod)
  method?: OtpMethod;
}

// ─── التحقق من OTP ──────────────────────────────────────────────────────────
export class VerifyOtpDto {
  @ApiProperty({ example: '+966551234567' })
  @IsString()
  @Matches(/^\+[1-9]\d{1,14}$/, { message: 'رقم الهاتف غير صحيح' })
  phone: string;

  @ApiProperty({ example: '123456', description: 'رمز OTP المُرسَل للمستخدم' })
  @IsString()
  @MinLength(4)
  @MaxLength(8)
  otp: string;
}