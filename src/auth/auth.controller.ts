// src/auth/auth.controller.ts
import { Controller, Post, Get, Body, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AuthService }    from './auth.service';
import { JwtAuthGuard }   from './guards/jwt-auth.guard';
import { RegisterDto, LoginDto, SendOtpDto, VerifyOtpDto, ResetPasswordDto, RefreshTokenDto } from './dto/auth.dto';

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
  @ApiOperation({ summary: 'تسجيل الدخول | Login', description: 'يتحقق من بيانات المستخدم ويُرجع Access Token و Refresh Token' })
  @ApiResponse({ status: 200, description: 'تم تسجيل الدخول بنجاح', schema: { example: { statusCode: 200, path: '/auth/login', timestamp: '2026-06-21T08:00:00.000Z', success: true, access_token: 'eyJ...', refresh_token: 'eyJ...', token_type: 'Bearer', user: { id: 1, name: 'محمود أحمد', phone: '+249912345678', profile_image: null, is_verified: true, created_at: '2026-01-01T00:00:00.000Z' } } } })
  @ApiResponse({ status: 401, description: 'فشل المصادقة (كلمة مرور خاطئة أو حساب غير مفعل)', schema: { example: { statusCode: 401, message: 'كلمة المرور غير صحيحة', timestamp: '2026-06-21T08:00:00.000Z', path: '/auth/login' } } })
  @ApiResponse({ status: 404, description: 'المستخدم غير موجود', schema: { example: { statusCode: 404, message: 'لا يوجد حساب بهذا الرقم', timestamp: '2026-06-21T08:00:00.000Z', path: '/auth/login' } } })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'تجديد التوكن | Refresh Token', description: 'يستخدم Refresh Token صالح للحصول على Access Token جديد' })
  @ApiResponse({ status: 200, description: 'تم تجديد التوكن بنجاح', schema: { example: { statusCode: 200, path: '/auth/refresh-token', timestamp: '2026-06-21T08:00:00.000Z', success: true, access_token: 'eyJ...', refresh_token: 'eyJ...', token_type: 'Bearer' } } })
  @ApiResponse({ status: 401, description: 'Refresh Token غير صالح أو منتهي الصلاحية', schema: { example: { statusCode: 401, message: 'Refresh Token غير صالح أو منتهي', timestamp: '2026-06-21T08:00:00.000Z', path: '/auth/refresh-token' } } })
  refreshToken(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto);
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
  @ApiOperation({ summary: 'التحقق من رمز OTP | Verify OTP', description: 'يتحقق من الرمز المرسل للهاتف، يُفعّل الحساب، ويُرجع توكنات الدخول' })
  @ApiResponse({ status: 200, description: 'تم التحقق بنجاح', schema: { example: { statusCode: 200, path: '/auth/verify-otp', timestamp: '2026-06-21T08:00:00.000Z', success: true, access_token: 'eyJ...', refresh_token: 'eyJ...', token_type: 'Bearer', user: { id: 1, name: 'محمود أحمد', phone: '+249912345678', is_verified: true } } } })
  @ApiResponse({ status: 401, description: 'رمز التحقق غير صحيح أو منتهي', schema: { example: { statusCode: 401, message: 'رمز التحقق غير صحيح أو منتهي الصلاحية', timestamp: '2026-06-21T08:00:00.000Z', path: '/auth/verify-otp' } } })
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