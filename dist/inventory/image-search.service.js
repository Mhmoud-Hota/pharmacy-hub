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
const sdk_1 = require("@anthropic-ai/sdk");
let ImageSearchService = ImageSearchService_1 = class ImageSearchService {
    constructor() {
        this.logger = new common_1.Logger(ImageSearchService_1.name);
        this.anthropic = new sdk_1.default({
            apiKey: process.env.ANTHROPIC_API_KEY,
        });
    }
    async extractMedicineFromImage(imageBuffer, mimeType) {
        try {
            const base64Image = imageBuffer.toString('base64');
            const response = await this.anthropic.messages.create({
                model: 'claude-opus-4-5',
                max_tokens: 1024,
                messages: [
                    {
                        role: 'user',
                        content: [
                            {
                                type: 'image',
                                source: {
                                    type: 'base64',
                                    media_type: mimeType,
                                    data: base64Image,
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
  "primary_name": "اسم الدواء الرئيسي (الأوضح في الصورة)",
  "alternative_names": ["اسم بديل 1", "اسم بديل 2"],
  "confidence": "high|medium|low"
}

إذا لم تجد أي دواء:
{
  "found": false,
  "message": "سبب عدم التعرف"
}

ملاحظات مهمة:
- اكتب اسم الدواء كما هو في الصورة (عربي أو إنجليزي أو كليهما)
- إذا كانت روشتة بأسماء متعددة، ضع الأول أو الأوضح كـ primary_name والباقي في alternative_names
- لا تخمّن، فقط استخرج ما هو مكتوب بوضوح`,
                            },
                        ],
                    },
                ],
            });
            const textContent = response.content.find((c) => c.type === 'text');
            if (!textContent || textContent.type !== 'text') {
                return { found: false, message: 'لم يتمكن الذكاء الاصطناعي من تحليل الصورة' };
            }
            const rawText = textContent.text.trim();
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
            if (error?.status === 401) {
                return { found: false, message: 'خطأ في مفتاح Anthropic API' };
            }
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