"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventoryModule = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const inventory_controller_1 = require("./inventory.controller");
const inventory_service_1 = require("./inventory.service");
const geo_search_service_1 = require("./geo-search.service");
const bulk_import_controller_1 = require("./bulk-import.controller");
const bulk_import_service_1 = require("./bulk-import.service");
const image_search_controller_1 = require("./image-search.controller");
const image_search_service_1 = require("./image-search.service");
const database_module_1 = require("../database/database.module");
const webhook_module_1 = require("../webhook/webhook.module");
let InventoryModule = class InventoryModule {
};
exports.InventoryModule = InventoryModule;
exports.InventoryModule = InventoryModule = __decorate([
    (0, common_1.Module)({
        imports: [
            database_module_1.DatabaseModule,
            webhook_module_1.WebhookModule,
            platform_express_1.MulterModule.register({ storage: (0, multer_1.memoryStorage)() }),
        ],
        controllers: [
            inventory_controller_1.InventoryController,
            bulk_import_controller_1.BulkImportController,
            image_search_controller_1.ImageSearchController,
        ],
        providers: [
            inventory_service_1.InventoryService,
            geo_search_service_1.GeoSearchService,
            bulk_import_service_1.BulkImportService,
            image_search_service_1.ImageSearchService,
        ],
        exports: [inventory_service_1.InventoryService, geo_search_service_1.GeoSearchService],
    })
], InventoryModule);
//# sourceMappingURL=inventory.module.js.map