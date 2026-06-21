// src/auth/auth.controller.ts
import { Controller, Post, Get, Body, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AuthService }    from './auth.service';
import { JwtAuthGuard }   from './guards/jwt-auth.guard';
import { RegisterDto, LoginDto, SendOtpDto, VerifyOtpDto, ResetPasswordDto } from './dto/auth.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'تسجيل مستخدم جديد', description: 'ينشئ حساباً ويُرسل OTP تلقائياً' })
  @ApiResponse({ status: 201, description: 'تم الإنشاء وإرسال OTP', schema: { example: { success: true, message: 'تم إنشاء الحساب، أدخل رمز OTP للتحقق', user_id: 1 } } })
  @ApiResponse({ status: 409, description: 'رقم الهاتف مسجّل مسبقاً' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'تسجيل الدخول بكلمة المرور', description: 'يُرجع access_token مباشرة' })
  @ApiResponse({ status: 200, schema: { example: { success: true, access_token: 'eyJ...', token_type: 'Bearer', user: { id: 1, name: 'محمود', phone: '+249912345678', is_verified: true } } } })
  @ApiResponse({ status: 401, description: 'كلمة المرور غير صحيحة' })
  @ApiResponse({ status: 401, description: 'الحساب غير مفعّل — أكمل التحقق من OTP' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('send-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'إرسال OTP', description: 'يُرسل رمز OTP لرقم الهاتف' })
  @ApiResponse({ status: 200, schema: { example: { success: true, message: 'تم إرسال رمز التحقق' } } })
  @ApiResponse({ status: 404, description: 'لا يوجد حساب بهذا الرقم' })
  sendOtp(@Body() dto: SendOtpDto) {
    return this.authService.sendOtp(dto);
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'التحقق من OTP بعد التسجيل', description: 'يُفعّل الحساب ويُرجع access_token' })
  @ApiResponse({ status: 200, schema: { example: { success: true, access_token: 'eyJ...', token_type: 'Bearer', user: { id: 1, name: 'محمود', phone: '+249912345678', is_verified: true } } } })
  @ApiResponse({ status: 401, description: 'رمز OTP خاطئ أو منتهي الصلاحية' })
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'نسيت كلمة المرور', description: 'يُرسل OTP لإعادة التعيين' })
  @ApiResponse({ status: 200, schema: { example: { success: true, message: 'تم إرسال رمز إعادة التعيين' } } })
  @ApiResponse({ status: 404, description: 'لا يوجد حساب بهذا الرقم' })
  forgotPassword(@Body() dto: SendOtpDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'إعادة تعيين كلمة المرور', description: 'يتحقق من OTP ويحدّث كلمة المرور' })
  @ApiResponse({ status: 200, schema: { example: { success: true, message: 'تم تغيير كلمة المرور بنجاح' } } })
  @ApiResponse({ status: 401, description: 'رمز OTP خاطئ أو منتهي الصلاحية' })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'بيانات المستخدم الحالي', description: 'يتطلب Bearer Token' })
  @ApiResponse({ status: 200, schema: { example: { id: 1, name: 'محمود', phone: '+249912345678', profile_image: null, is_verified: true, created_at: '2026-01-01T00:00:00.000Z' } } })
  @ApiResponse({ status: 401, description: 'Token مفقود أو منتهي' })
  getMe(@Request() req: { user: { sub: number } }) {
    return this.authService.getMe(req.user.sub);
  }
}