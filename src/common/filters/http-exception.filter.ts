// src/common/filters/http-exception.filter.ts
/**
 * هذا الـ filter يمسك كل استثناءات الـ HTTP ويُعيدها
 * بتنسيق موحّد مع رسائل واضحة باللغة العربية حيث أمكن.
 *
 * يُحل مشكلة:
 *   "Unexpected token 'B', \"Body: { \"p\"... is not valid JSON"
 * التي تنتج عن إرسال الـ body كـ text وليس JSON صحيح.
 */
import {
  ExceptionFilter, Catch, ArgumentsHost,
  HttpException, HttpStatus, Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx      = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request  = ctx.getRequest<Request>();
    const status   = exception.getStatus();
    const body     = exception.getResponse();

    // ── تحسين رسالة أخطاء الـ Validation ──────────────────────────────────
    let message: string | string[];
    if (typeof body === 'object' && body !== null) {
      const b = body as any;
      // أخطاء الـ ValidationPipe تأتي كـ array في b.message
      message = b.message ?? b.error ?? 'حدث خطأ';

      // ── اكتشاف خطأ JSON parse ──────────────────────────────────────────
      if (
        status === HttpStatus.BAD_REQUEST &&
        typeof message === 'string' &&
        (message.includes('JSON') || message.includes('Unexpected token'))
      ) {
        message = 'تنسيق الـ Body غير صحيح. تأكد من إرسال JSON صالح مع Header: Content-Type: application/json';
      }
    } else {
      message = body as string;
    }

    const errorResponse = {
      statusCode: status,
      message,
      path:       request.url,
      timestamp:  new Date().toISOString(),
    };

    this.logger.warn(`[${status}] ${request.method} ${request.url} — ${JSON.stringify(message)}`);
    response.status(status).json(errorResponse);
  }
}