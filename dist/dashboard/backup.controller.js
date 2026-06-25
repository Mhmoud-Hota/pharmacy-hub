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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BackupController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const backup_service_1 = require("./backup.service");
let BackupController = class BackupController {
    constructor(svc) {
        this.svc = svc;
    }
    async fullBackup(res) {
        const data = await this.svc.fullBackup();
        const filename = `pharmacy-hub-full-${new Date().toISOString().split('T')[0]}.json`;
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(JSON.stringify(data, null, 2));
    }
    async pharmacyBackup(id, res) {
        const data = await this.svc.pharmacyBackup(id);
        const filename = `pharmacy-${data.meta.pharmacySlug}-${data.meta.exportedAt.split('T')[0]}.json`;
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(JSON.stringify(data, null, 2));
    }
    async pharmacyBackupCsv(id, res) {
        const csv = await this.svc.pharmacyBackupCsv(id);
        const pharmacy = await this.svc.pharmacyBackup(id);
        const filename = `pharmacy-${pharmacy.meta.pharmacySlug}-${new Date().toISOString().split('T')[0]}.csv`;
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send('\uFEFF' + csv);
    }
    clearStock(id) {
        return this.svc.clearPharmacyStock(id);
    }
    importCsv(id, body) {
        return this.svc.importFromCsv(id, body.csv, body.mode ?? 'merge');
    }
    importJson(id, body) {
        return this.svc.importFromJson(id, body.data, body.mode ?? 'merge');
    }
    importSql(id, body) {
        return this.svc.importFromSql(id, body.sql, body.mode ?? 'merge');
    }
    getSearchStats(days = '30') {
        return this.svc.getSearchStats(+days);
    }
};
exports.BackupController = BackupController;
__decorate([
    (0, common_1.Get)('full'),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BackupController.prototype, "fullBackup", null);
__decorate([
    (0, common_1.Get)('pharmacy/:id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], BackupController.prototype, "pharmacyBackup", null);
__decorate([
    (0, common_1.Get)('pharmacy/:id/csv'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], BackupController.prototype, "pharmacyBackupCsv", null);
__decorate([
    (0, common_1.Delete)('pharmacy/:id/clear'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], BackupController.prototype, "clearStock", null);
__decorate([
    (0, common_1.Post)('pharmacy/:id/import/csv'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], BackupController.prototype, "importCsv", null);
__decorate([
    (0, common_1.Post)('pharmacy/:id/import/json'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], BackupController.prototype, "importJson", null);
__decorate([
    (0, common_1.Post)('pharmacy/:id/import/sql'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], BackupController.prototype, "importSql", null);
__decorate([
    (0, common_1.Get)('search-stats'),
    __param(0, (0, common_1.Query)('days')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], BackupController.prototype, "getSearchStats", null);
exports.BackupController = BackupController = __decorate([
    (0, swagger_1.ApiExcludeController)(),
    (0, common_1.Controller)('api/dashboard/backup'),
    __metadata("design:paramtypes", [backup_service_1.BackupService])
], BackupController);
//# sourceMappingURL=backup.controller.js.map