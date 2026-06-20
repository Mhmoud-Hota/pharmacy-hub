// src/auth/auth.controller.ts
import {
  Controller, Post, Get, Body,
  UseGuards, Request, HttpCode, HttpStatus,
} from '@nestjs/common';
import {
  ApiTags, ApiOperation, ApiBearerAuth,
  ApiResponse, ApiConsumes,
} from '@nestjs/swagger';
import { AuthService }                           from './auth.service';
import { JwtAuthGuard }                          from './guards/jwt-auth.guard';
import { RegisterDto, SendOtpDto, VerifyOtpDto } from './dto/auth.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /auth/register
   * Body (JSON): { "name": "...", "phone": "+249...", "method": "sms" }
   */
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiConsumes('application/json')
  @ApiOperation({
    summary:     'تسجيل مستخدم جديد',
    description: `
      ينشئ حساباً جديداً ويُرسل OTP للتحقق.

      **مثال الـ Body:**
      \`\`\`json
      {
        "name": "محمود أحمد",
        "phone": "+249912345678",
        "method": "sms"
      }
      \`\`\`

      بعد استلام الكود استخدم \`POST /auth/verify-otp\`
    `,
  })
  @ApiResponse({ status: 201, description: 'تم الإنشاء وإرسال OTP' })
  @ApiResponse({ status: 400, description: 'بيانات غير صحيحة' })
  @ApiResponse({ status: 409, description: 'رقم الهاتف مسجّل مسبقاً' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  /**
   * POST /auth/send-otp
   * Body (JSON): { "phone": "+249...", "method": "sms" }
   */
  @Post('send-otp')
  @HttpCode(HttpStatus.OK)
  @ApiConsumes('application/json')
  @ApiOperation({
    summary:     'إرسال OTP لتسجيل الدخول',
    description: `
      يُرسل رمز OTP لرقم الهاتف.

      **مثال الـ Body:**
      \`\`\`json
      {
        "phone": "+249912345678",
        "method": "sms"
      }
      \`\`\`
    `,
  })
  @ApiResponse({ status: 200, description: 'تم إرسال OTP' })
  @ApiResponse({ status: 404, description: 'المستخدم غير موجود' })
  sendOtp(@Body() dto: SendOtpDto) {
    return this.authService.sendLoginOtp(dto);
  }

  /**
   * POST /auth/verify-otp
   * Body (JSON): { "phone": "+249...", "otp": "123456" }
   */
  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiConsumes('application/json')
  @ApiOperation({
    summary:     'التحقق من OTP والحصول على JWT Token',
    description: `
      **مثال الـ Body:**
      \`\`\`json
      {
        "phone": "+249912345678",
        "otp": "123456"
      }
      \`\`\`

      يُعيد \`access_token\` استخدمه في Header:
      \`Authorization: Bearer <token>\`
    `,
  })
  @ApiResponse({
    status: 200,
    schema: {
      example: {
        success:      true,
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        token_type:   'Bearer',
        user: { id: 1, name: 'محمود', phone: '+249912345678', is_verified: true },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'رمز OTP خاطئ أو منتهي' })
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyAndLogin(dto);
  }

  /**
   * GET /auth/me
   * Header: Authorization: Bearer <token>
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'بيانات المستخدم الحالي (يتطلب Bearer Token)' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 401, description: 'Token مفقود أو منتهي' })
  getMe(@Request() req: { user: { sub: number } }) {
    return this.authService.getMe(req.user.sub);
  }
}