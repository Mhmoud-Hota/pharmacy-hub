import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';

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
  private readonly client: OpenAI;

  constructor() {
    const apiKey = process.env.APIFREE_API_KEY;
    if (!apiKey) {
      throw new Error('APIFREE_API_KEY is not set in environment variables');
    }

    this.client = new OpenAI({
      apiKey,
      baseURL: 'https://api.apifree.ai/v1',
    });
  }

  async extractMedicineFromImage(
    imageBuffer: Buffer,
    mimeType: string,
  ): Promise<ExtractionResult> {
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

    }catch (error) {
  this.logger.error('ImageSearchService error:', error);
  this.logger.error('Error details:', {
    message: (error as any)?.message,
    status: (error as any)?.status,
    code: (error as any)?.code,
    response: (error as any)?.response?.data ?? (error as any)?.response,
  });
  //  catch (error) {
  //     this.logger.error('ImageSearchService error:', error);

  //     // ✅ الحل الصحيح لخطأ TypeScript
  //     const status = (error as any)?.status ?? (error as any)?.response?.status;
  //     if (status === 401) {
  //       return { found: false, message: 'خطأ في مفتاح API - تحقق من APIFREE_API_KEY' };
  //     }
  //     if (status === 404) {
  //       return { found: false, message: 'النموذج غير موجود - تحقق من اسم الموديل' };
  //     }

      return {
        found: false,
        message: 'حدث خطأ أثناء تحليل الصورة، يرجى المحاولة مرة أخرى',
      };
    }
  }
}