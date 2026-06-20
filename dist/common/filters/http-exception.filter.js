"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var HttpExceptionFilter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
let HttpExceptionFilter = HttpExceptionFilter_1 = class HttpExceptionFilter {
    constructor() {
        this.logger = new common_1.Logger(HttpExceptionFilter_1.name);
    }
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        const status = exception.getStatus();
        const body = exception.getResponse();
        let message;
        if (typeof body === 'object' && body !== null) {
            const b = body;
            message = b.message ?? b.error ?? 'حدث خطأ';
            if (status === common_1.HttpStatus.BAD_REQUEST &&
                typeof message === 'string' &&
                (message.includes('JSON') || message.includes('Unexpected token'))) {
                message = 'تنسيق الـ Body غير صحيح. تأكد من إرسال JSON صالح مع Header: Content-Type: application/json';
            }
        }
        else {
            message = body;
        }
        const errorResponse = {
            statusCode: status,
            message,
            path: request.url,
            timestamp: new Date().toISOString(),
        };
        this.logger.warn(`[${status}] ${request.method} ${request.url} — ${JSON.stringify(message)}`);
        response.status(status).json(errorResponse);
    }
};
exports.HttpExceptionFilter = HttpExceptionFilter;
exports.HttpExceptionFilter = HttpExceptionFilter = HttpExceptionFilter_1 = __decorate([
    (0, common_1.Catch)(common_1.HttpException)
], HttpExceptionFilter);
//# sourceMappingURL=http-exception.filter.js.map