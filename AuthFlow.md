# Auth API Flow

## تسجيل مستخدم جديد
```
POST /auth/register
Body: { "name": "محمود", "phone": "+249912345678", "method": "sms" }

Response 201:
{ "success": true, "message": "تم إنشاء الحساب...", "user_id": 1 }
```

## تسجيل الدخول (مستخدم موجود)
```
POST /auth/send-otp
Body: { "phone": "+249912345678", "method": "sms" }

Response 200:
{ "success": true, "message": "تم إرسال رمز التحقق" }
```

## التحقق من OTP → الحصول على Token
```
POST /auth/verify-otp
Body: { "phone": "+249912345678", "otp": "123456" }

Response 200:
{
  "success": true,
  "access_token": "eyJhbGci...",
  "token_type": "Bearer",
  "user": { "id": 1, "name": "محمود", "phone": "+249912345678", "is_verified": true }
}
```

## استخدام Token في الطلبات المحمية
```
GET /auth/me
Header: Authorization: Bearer eyJhbGci...

Response 200:
{ "id": 1, "name": "محمود", "phone": "+249912345678", "is_verified": true, "created_at": "..." }
```

## حماية أي endpoint بـ JWT
```typescript
import { UseGuards }    from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Get('protected-route')
@UseGuards(JwtAuthGuard)
myProtectedRoute(@Request() req) {
  // req.user = { sub: userId, phone, name }
  return req.user;
}
```