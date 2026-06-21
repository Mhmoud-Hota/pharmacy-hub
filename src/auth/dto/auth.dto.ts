// src/auth/dto/auth.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, MinLength } from 'class-validator';

export enum OtpMethod { SMS = 'sms', WHATSAPP = 'whatsapp' }

export class RegisterDto {
  @ApiProperty({ example: 'محمود أحمد', description: 'اسم المستخدم الكامل' })
  @IsString()
  name: string;

  @ApiProperty({ example: '+249912345678', description: 'رقم الهاتف مع كود الدولة' })
  @IsString()
  phone: string;

  @ApiProperty({ example: 'Password123', description: 'كلمة المرور (6 أحرف على الأقل)', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({ example: 'https://...', description: 'رابط صورة الملف الشخصي' })
  @IsOptional()
  @IsString()
  profileImage?: string;

  @ApiPropertyOptional({ enum: OtpMethod, default: OtpMethod.SMS })
  @IsOptional()
  method?: OtpMethod;
}

export class LoginDto {
  @ApiProperty({ example: '+249912345678' })
  @IsString()
  phone: string;

  @ApiProperty({ example: 'Password123' })
  @IsString()
  password: string;
}

export class SendOtpDto {
  @ApiProperty({ example: '+249912345678' })
  @IsString()
  phone: string;

  @ApiPropertyOptional({ enum: OtpMethod, default: OtpMethod.SMS })
  @IsOptional()
  method?: OtpMethod;
}

export class VerifyOtpDto {
  @ApiProperty({ example: '+249912345678' })
  @IsString()
  phone: string;

  @ApiProperty({ example: '123456', description: 'الرمز المكون من 6 أرقام' })
  @IsString()
  otp: string;
}

export class ResetPasswordDto {
  @ApiProperty({ example: '+249912345678' })
  @IsString()
  phone: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  otp: string;

  @ApiProperty({ example: 'NewPassword123', minLength: 6 })
  @IsString()
  @MinLength(6)
  newPassword: string;
}