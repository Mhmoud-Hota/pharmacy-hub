"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var ImageSearchService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImageSearchService = void 0;
const common_1 = require("@nestjs/common");
const openai_1 = require("openai");
let ImageSearchService = ImageSearchService_1 = class ImageSearchService {
    constructor() {
        this.logger = new common_1.Logger(ImageSearchService_1.name);
        const apiKey = process.env.APIFREE_API_KEY;
        if (!apiKey) {
            throw new Error('APIFREE_API_KEY is not set in environment variables');
        }
        this.client = new openai_1.default({
            apiKey,
            baseURL: 'https://api.apifree.ai/v1',
        });
    }
    async extractMedicineFromImage(imageBuffer, mimeType) {
        try {
            const base64Image = imageBuffer.toString('base64');
            const response = await this.client.chat.completions.create({
                model: 'gpt-5.2',
                max_tokens: 1024,
                messages: [
                    {
                        role: 'user',
                        content: [
                            {
                                type: 'image_url',
                                image_url: {
                                    url: `data:${mimeType};base64,${base64Image}`,
                                },
                            },
                            {
                                type: 'text',
                                text: `أنت نظام متخصص في استخراج أسماء الأدوية من الصور الطبية.

المهمة: افحص هذه الصورة واستخرج اسم الدواء أو أسماء الأدوية الموجودة فيها.

قد تكون الصورة:
- روشتة طبية (وصفة) تحتوي على أسماء أدوية
- علبة دواء تحتوي على اسم الدواء
- صورة لأي مستحضر صيدلاني

أرجع الإجابة بتنسيق JSON فقط، بدون أي نص إضافي:

إذا وجدت دواء واحداً أو أكثر:
{
  "found": true,
  "primary_name": "اسم الدواء الرئيسي",
  "alternative_names": ["اسم بديل 1", "اسم بديل 2"],
  "confidence": "high|medium|low"
}

إذا لم تجد أي دواء:
{
  "found": false,
  "message": "سبب عدم التعرف"
}

ملاحظات:
- اكتب اسم الدواء كما هو في الصورة (عربي أو إنجليزي)
- لا تخمّن، فقط استخرج ما هو مكتوب بوضوح`,
                            },
                        ],
                    },
                ],
            });
            const rawText = response.choices[0]?.message?.content?.trim();
            if (!rawText) {
                return { found: false, message: 'لم يتمكن الذكاء الاصطناعي من تحليل الصورة' };
            }
            this.logger.debug(`AI raw response: ${rawText}`);
            const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            let parsed;
            try {
                parsed = JSON.parse(cleaned);
            }
            catch {
                this.logger.warn(`Failed to parse AI response as JSON: ${rawText}`);
                return { found: false, message: 'خطأ في تحليل استجابة الذكاء الاصطناعي', rawResponse: rawText };
            }
            if (!parsed.found) {
                return {
                    found: false,
                    message: parsed.message ?? 'لم يتم التعرف على دواء في الصورة',
                };
            }
            return {
                found: true,
                medicineName: parsed.primary_name,
                alternativeNames: parsed.alternative_names ?? [],
                rawResponse: rawText,
            };
        }
        catch (error) {
            this.logger.error('ImageSearchService error:', error);
            this.logger.error('Error details:', {
                message: error?.message,
                status: error?.status,
                code: error?.code,
                response: error?.response?.data ?? error?.response,
            });
            return {
                found: false,
                message: 'حدث خطأ أثناء تحليل الصورة، يرجى المحاولة مرة أخرى',
            };
        }
    }
};
exports.ImageSearchService = ImageSearchService;
exports.ImageSearchService = ImageSearchService = ImageSearchService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], ImageSearchService);
//# sourceMappingURL=image-search.service.js.map