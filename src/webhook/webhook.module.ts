// src/webhook/webhook.module.ts
import { Module } from '@nestjs/common';
import { WebhookController } from './webhook.controller';
import { WebhookProcessorService } from './webhook-processor.service';
import { MedicineResolverService } from './medicine-resolver.service';

@Module({
  controllers: [WebhookController],
  providers: [WebhookProcessorService, MedicineResolverService],
  exports: [MedicineResolverService],
})
export class WebhookModule {}
