// src/main.ts
import { NestFactory }    from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule }           from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(require('express').json({ limit: '50mb' }));
  app.use(require('express').urlencoded({ limit: '50mb', extended: true }));

  app.enableCors();
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalPipes(new ValidationPipe({
    whitelist:            true,
    transform:            true,
    forbidNonWhitelisted: false,
    validationError:      { target: false, value: false },
  }));

  // ── Swagger ────────────────────────────────────────────────────────────────
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Pharmacy Hub API')
    .setDescription(`
## نظام إدارة المخزون المركزي للصيدليات

---

	### 🔐 تدفق المصادقة | Authentication Flow
	
	#### تسجيل مستخدم جديد:
	1. **POST /auth/register**: إرسال بيانات المستخدم. سيتم إنشاء الحساب وإرسال رمز OTP تلقائياً.
	2. **POST /auth/verify-otp**: إرسال الرمز المستلم. في حال النجاح، سيتم تفعيل الحساب وإرجاع \`access_token\` و \`refresh_token\`.
	
	#### تسجيل الدخول:
	- **POST /auth/login**: إرسال الهاتف وكلمة المرور. يُرجع \`access_token\` (صالح لـ 15 دقيقة) و \`refresh_token\` (صالح لـ 7 أيام).
	
	#### تجديد التوكن:
	- **POST /auth/refresh-token**: عند انتهاء صلاحية الـ Access Token، استخدم الـ Refresh Token للحصول على واحد جديد دون الحاجة لتسجيل الدخول مرة أخرى.
	
	#### نسيت كلمة المرور:
	1. **POST /auth/forgot-password**: إرسال رقم الهاتف لاستلام OTP.
	2. **POST /auth/reset-password**: إرسال الرمز وكلمة المرور الجديدة.
	
	---
	
	### 🔑 استخدام التوكن | Token Usage
	يجب تضمين الـ \`access_token\` في ترويسة الطلبات المحمية:
	\`\`\`http
	Authorization: Bearer <access_token>
	\`\`\`
	
	---
	
	### 📦 هيكلية الاستجابة الموحدة | Unified Response Structure
	جميع الاستجابات (الناجحة والفاشلة) تتبع هيكلاً موحداً يضمن وجود المسار (\`path\`) والوقت (\`timestamp\`) وحالة الطلب (\`statusCode\`) لتسهيل التعامل معها في الواجهات الأمامية.

	**مثال على استجابة ناجحة:**
	\`\`\`json
	{
	  "statusCode": 200,
	  "path": "/auth/login",
	  "timestamp": "2026-06-21T08:00:00.000Z",
	  "success": true,
	  "access_token": "eyJ...",
	  "refresh_token": "eyJ...",
	  "user": { ... }
	}
	\`\`\`

	**مثال على استجابة خطأ:**
	\`\`\`json
	{
	  "statusCode": 401,
	  "message": "كلمة المرور غير صحيحة",
	  "path": "/auth/login",
	  "timestamp": "2026-06-21T08:00:00.000Z"
	}
	\`\`\`

---

### 📦 مزامنة المخزون من الصيدليات (Webhook)
\`\`\`
POST /webhooks/:pharmacySlug
X-API-Key: <pharmacy_api_key>
Content-Type: application/json

{
  "event": "medicine.updated",
  "data": { "barcode": "123", "quantity": 50, "price": 100 }
}
\`\`\`

أنواع الأحداث المدعومة:
- \`medicine.added\`
- \`medicine.updated\`
- \`medicine.deleted\`
- \`sale.created\`
    `)
    .setVersion('2.0')
    .addTag('Auth',       '🔐 المصادقة — تسجيل، دخول، OTP، كلمة المرور')
    .addTag('Webhooks',   '📦 أحداث المخزون الواردة من الصيدليات')
    .addTag('Inventory',  '🔍 البحث وعرض المخزون')
    .addTag('Pharmacies', '🏥 إدارة الصيدليات')
    .addTag('Dashboard',  '📊 لوحة التحكم الإدارية')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', description: 'أدخل access_token هنا' },
      'JWT',
    )
    .build();

  SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, swaggerConfig), {
    swaggerOptions: {
      persistAuthorization: true,          // يحفظ التوكن بعد refresh الصفحة
      tagsSorter:           'alpha',
      operationsSorter:     'alpha',
      docExpansion:         'none',        // يبدأ مطوياً
      filter:               true,          // خانة بحث
      tryItOutEnabled:      true,          // يفتح "Try it out" تلقائياً
    },
    customSiteTitle: 'Pharmacy Hub — API Docs',
    customCss: `
      .swagger-ui .topbar { background: #006D5B; }
      .swagger-ui .topbar-wrapper img { display: none; }
      .swagger-ui .topbar-wrapper::after {
        content: '🏥 Pharmacy Hub API';
        color: white;
        font-size: 18px;
        font-weight: bold;
        padding: 10px;
      }
      .swagger-ui .info .title { color: #006D5B; }
      .swagger-ui .btn.authorize { border-color: #006D5B; color: #006D5B; }
      .swagger-ui .btn.authorize svg { fill: #006D5B; }
    `,
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  console.log(`\n🏥 Pharmacy Hub  →  http://localhost:${port}`);
  console.log(`📊 Dashboard     →  http://localhost:${port}/dashboard/`);
  console.log(`📖 API Docs      →  http://localhost:${port}/api/docs\n`);
}
bootstrap();