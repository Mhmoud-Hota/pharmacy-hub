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
exports.DashboardController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const dashboard_service_1 = require("./dashboard.service");
let DashboardController = class DashboardController {
    constructor(svc) {
        this.svc = svc;
    }
    getStats() { return this.svc.getStats(); }
    getPharmacies() { return this.svc.getPharmacies(); }
    getPharmacy(id) { return this.svc.getPharmacyDetail(id); }
    getPharmacyStats(id) { return this.svc.getPharmacyStats(id); }
    createPharmacy(body) { return this.svc.createPharmacy(body); }
    updatePharmacy(id, body) {
        return this.svc.updatePharmacy(id, body);
    }
    togglePharmacy(id, body) {
        return this.svc.togglePharmacy(id, body.active);
    }
    regenerateKey(id) { return this.svc.regenerateApiKey(id); }
    getMedicines(page = '1', limit = '50', search = '', category = '') { return this.svc.getMedicines(+page, +limit, search, category); }
    getLogs(page = '1', pharmacyId, status) { return this.svc.getWebhookLogs(+page, pharmacyId ? +pharmacyId : undefined, status); }
    getUsers(page = '1', limit = '15', search = '', isVerified) {
        const verified = isVerified === 'true' ? true : isVerified === 'false' ? false : undefined;
        return this.svc.getUsers(+page, +limit, search, verified);
    }
    getUserById(id) {
        return this.svc.getUserById(id);
    }
    createUser(body) {
        return this.svc.createUser(body);
    }
    updateUser(id, body) {
        return this.svc.updateUser(id, body);
    }
    deleteUser(id) {
        return this.svc.deleteUser(id);
    }
    async sendOtpToUser(id) {
        const user = await this.svc.getUserById(id);
        const res = await fetch(`http://localhost:${process.env.PORT ?? 3000}/auth/send-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: user.phone, method: 'sms' }),
        });
        const json = await res.json();
        if (!res.ok)
            throw new common_1.HttpException(json, res.status);
        return json;
    }
};
exports.DashboardController = DashboardController;
__decorate([
    (0, common_1.Get)('stats'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], DashboardController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)('pharmacies'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], DashboardController.prototype, "getPharmacies", null);
__decorate([
    (0, common_1.Get)('pharmacies/:id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], DashboardController.prototype, "getPharmacy", null);
__decorate([
    (0, common_1.Get)('pharmacies/:id/stats'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], DashboardController.prototype, "getPharmacyStats", null);
__decorate([
    (0, common_1.Post)('pharmacies'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], DashboardController.prototype, "createPharmacy", null);
__decorate([
    (0, common_1.Put)('pharmacies/:id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], DashboardController.prototype, "updatePharmacy", null);
__decorate([
    (0, common_1.Patch)('pharmacies/:id/toggle'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], DashboardController.prototype, "togglePharmacy", null);
__decorate([
    (0, common_1.Post)('pharmacies/:id/regenerate-key'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], DashboardController.prototype, "regenerateKey", null);
__decorate([
    (0, common_1.Get)('medicines'),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('search')),
    __param(3, (0, common_1.Query)('category')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object, Object]),
    __metadata("design:returntype", void 0)
], DashboardController.prototype, "getMedicines", null);
__decorate([
    (0, common_1.Get)('webhook-logs'),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('pharmacyId')),
    __param(2, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], DashboardController.prototype, "getLogs", null);
__decorate([
    (0, common_1.Get)('users'),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('search')),
    __param(3, (0, common_1.Query)('isVerified')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object, String]),
    __metadata("design:returntype", void 0)
], DashboardController.prototype, "getUsers", null);
__decorate([
    (0, common_1.Get)('users/:id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], DashboardController.prototype, "getUserById", null);
__decorate([
    (0, common_1.Post)('users'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], DashboardController.prototype, "createUser", null);
__decorate([
    (0, common_1.Put)('users/:id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], DashboardController.prototype, "updateUser", null);
__decorate([
    (0, common_1.Delete)('users/:id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], DashboardController.prototype, "deleteUser", null);
__decorate([
    (0, common_1.Post)('users/:id/send-otp'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "sendOtpToUser", null);
exports.DashboardController = DashboardController = __decorate([
    (0, swagger_1.ApiExcludeController)(),
    (0, common_1.Controller)('api/dashboard'),
    __metadata("design:paramtypes", [dashboard_service_1.DashboardService])
], DashboardController);
//# sourceMappingURL=dashboard.controller.js.map