// src/inventory/inventory.module.ts
import { Module } from '@nestjs/common';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { GeoSearchService } from './geo-search.service';
import { BulkImportController } from './bulk-import.controller';
import { BulkImportService } from './bulk-import.service';
import { WebhookModule } from '../webhook/webhook.module';

@Module({
  imports: [WebhookModule],   // لاستخدام MedicineResolverService
  controllers: [InventoryController, BulkImportController],
  providers: [InventoryService, GeoSearchService, BulkImportService],
})
export class InventoryModule {}
