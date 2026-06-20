// src/main.ts
import { NestFactory }    from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule }           from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ── CORS ───────────────────────────────────────────────────────────────────
  app.enableCors();

  // ── Global Exception Filter ────────────────────────────────────────────────
  // يُعيد رسائل خطأ واضحة بدلاً من "Unexpected token ..."
  app.useGlobalFilters(new HttpExceptionFilter());

  // ── ValidationPipe ─────────────────────────────────────────────────────────
  // transform: true  ← يحوّل الأنواع تلقائياً
  // whitelist: true  ← يحذف حقولاً غير مُعرَّفة في الـ DTO
  app.useGlobalPipes(new ValidationPipe({
    whitelist:            true,
    transform:            true,
    forbidNonWhitelisted: false,
    // رسائل الأخطاء بالتفصيل
    validationError:      { target: false, value: false },
  }));

  // ── Swagger ────────────────────────────────────────────────────────────────
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Pharmacy Hub API')
    .setDescription(`
## نظام إدارة المخزون المركزي للصيدليات

### ⚠️ تنبيه مهم عند اختبار الـ API:
تأكد من إرسال \`Content-Type: application/json\` في كل طلب يحتوي على Body.

**مثال صحيح:**
\`\`\`
POST /auth/register
Content-Type: application/json

{
  "name": "محمود أحمد",
  "phone": "+249912345678",
  "method": "sms"
}
\`\`\`
    `)
    .setVersion('2.0')
    .addTag('Auth',       'تسجيل الدخول والتحقق عبر OTP')
    .addTag('Webhooks',   'أحداث المخزون الواردة من الصيدليات')
    .addTag('Inventory',  'إدارة المخزون والبحث')
    .addTag('Pharmacies', 'إدارة الصيدليات')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'JWT')
    .build();

  SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, swaggerConfig));

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  console.log(`\n🏥 Pharmacy Hub  →  http://localhost:${port}`);
  console.log(`📊 Dashboard     →  http://localhost:${port}/dashboard/`);
  console.log(`📖 API Docs      →  http://localhost:${port}/api/docs\n`);
}
bootstrap();