// src/inventory/inventory.module.ts
import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

import { InventoryController }    from './inventory.controller';
import { InventoryService }       from './inventory.service';
import { GeoSearchService }       from './geo-search.service';
import { BulkImportController }   from './bulk-import.controller';
import { BulkImportService }      from './bulk-import.service';
import { ImageSearchController }  from './image-search.controller';
import { ImageSearchService }     from './image-search.service';
import { SqliteImportController } from './sqlite-import.controller';   // ← جديد
import { SqliteImportService }    from './sqlite-import.service';       // ← جديد
import { DatabaseModule }         from '../database/database.module';
import { WebhookModule }          from '../webhook/webhook.module';

@Module({
  imports: [
    DatabaseModule,
    WebhookModule,
    // نخزّن الملفات في الذاكرة مؤقتاً (buffer) — يشمل الآن ملفات .db
    MulterModule.register({ storage: memoryStorage() }),
  ],
  controllers: [
    InventoryController,
    BulkImportController,
    SqliteImportController,   // ← جديد
    ImageSearchController,
  ],
  providers: [
    InventoryService,
    GeoSearchService,
    BulkImportService,
    SqliteImportService,      // ← جديد
    ImageSearchService,
  ],
  exports: [InventoryService, GeoSearchService],
})
export class InventoryModule {}