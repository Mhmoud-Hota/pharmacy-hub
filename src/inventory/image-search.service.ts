// src/inventory/image-search.service.ts
/**
 * ImageSearchService
 * ──────────────────
 * يستخدم Claude AI (Anthropic) لاستخراج اسم الدواء من صورة روشتة أو علبة دواء.
 *
 * متطلبات:
 *   npm install @anthropic-ai/sdk
 *   متغير بيئة: ANTHROPIC_API_KEY
 */

import { Injectable, Logger } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';

export interface ExtractionResult {
  found: boolean;
  medicineName?: string;
  alternativeNames?: string[];
  message?: string;
  rawResponse?: string;
}

@Injectable()
export class ImageSearchService {
  private readonly logger = new Logger(ImageSearchService.name);
  private readonly anthropic: Anthropic;

  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  async extractMedicineFromImage(
    imageBuffer: Buffer,
    mimeType: string,
  ): Promise<ExtractionResult> {
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
                  media_type: mimeType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
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

      // تنظيف الاستجابة من markdown code blocks إن وُجدت
      const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

      let parsed: any;
      try {
        parsed = JSON.parse(cleaned);
      } catch {
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
    } catch (error) {
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
}