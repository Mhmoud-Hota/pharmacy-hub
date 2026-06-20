"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const auth_service_1 = require("./auth.service");
const node_test_1 = require("node:test");
(0, node_test_1.describe)('AuthService', () => {
    let service;
    (0, node_test_1.beforeEach)(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [auth_service_1.AuthService],
        }).compile();
        service = module.get(auth_service_1.AuthService);
    });
    (0, node_test_1.it)('should be defined', () => {
        expect(service).toBeDefined();
    });
});
//# sourceMappingURL=auth.service.spec.js.map