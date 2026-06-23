// src/inventory/inventory.module.ts
import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

import { InventoryController }   from './inventory.controller';
import { InventoryService }      from './inventory.service';
import { GeoSearchService }      from './geo-search.service';
import { BulkImportController }  from './bulk-import.controller';
import { BulkImportService }     from './bulk-import.service';
import { ImageSearchController } from './image-search.controller';
import { ImageSearchService }    from './image-search.service';
import { DatabaseModule }        from '../database/database.module';

@Module({
  imports: [
    DatabaseModule,
    // نخزّن الصورة في الذاكرة مؤقتاً (buffer) بدلاً من القرص
    MulterModule.register({ storage: memoryStorage() }),
  ],
  controllers: [
    InventoryController,
    BulkImportController,
    ImageSearchController,
  ],
  providers: [
    InventoryService,
    GeoSearchService,
    BulkImportService,
    ImageSearchService,
  ],
  exports: [InventoryService, GeoSearchService],
})
export class InventoryModule {}