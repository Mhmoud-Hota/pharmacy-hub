// src/main.ts
import { NestFactory }    from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule }           from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();
  app.useGlobalFilters(new HttpExceptionFilter());
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

### 🔐 تدفق المصادقة

#### تسجيل مستخدم جديد:
\`\`\`
1. POST /auth/register      → أرسل البيانات + يُرسل OTP تلقائياً
2. POST /auth/verify-otp    → تحقق من OTP → يُرجع access_token
\`\`\`

#### تسجيل الدخول:
\`\`\`
POST /auth/login  →  هاتف + كلمة مرور  →  access_token
\`\`\`

#### نسيت كلمة المرور:
\`\`\`
1. POST /auth/forgot-password  →  إرسال OTP
2. POST /auth/reset-password   →  OTP + كلمة المرور الجديدة
\`\`\`

---

### 🔑 استخدام التوكن
بعد الحصول على \`access_token\`، أضفه في كل طلب محمي:
\`\`\`
Authorization: Bearer <access_token>
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