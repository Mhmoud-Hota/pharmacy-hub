"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const app_module_1 = require("./app.module");
const http_exception_filter_1 = require("./common/filters/http-exception.filter");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.enableCors();
    app.useGlobalFilters(new http_exception_filter_1.HttpExceptionFilter());
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: false,
        validationError: { target: false, value: false },
    }));
    const swaggerConfig = new swagger_1.DocumentBuilder()
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
        .addTag('Auth', 'تسجيل الدخول والتحقق عبر OTP')
        .addTag('Webhooks', 'أحداث المخزون الواردة من الصيدليات')
        .addTag('Inventory', 'إدارة المخزون والبحث')
        .addTag('Pharmacies', 'إدارة الصيدليات')
        .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'JWT')
        .build();
    swagger_1.SwaggerModule.setup('api/docs', app, swagger_1.SwaggerModule.createDocument(app, swaggerConfig));
    const port = process.env.PORT ?? 3000;
    await app.listen(port);
    console.log(`\n🏥 Pharmacy Hub  →  http://localhost:${port}`);
    console.log(`📊 Dashboard     →  http://localhost:${port}/dashboard/`);
    console.log(`📖 API Docs      →  http://localhost:${port}/api/docs\n`);
}
bootstrap();
//# sourceMappingURL=main.js.map