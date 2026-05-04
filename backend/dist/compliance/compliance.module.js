"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComplianceModule = void 0;
const common_1 = require("@nestjs/common");
const compliance_repository_1 = require("./compliance.repository");
const compliance_service_1 = require("./compliance.service");
const compliance_controller_1 = require("./compliance.controller");
const licenses_module_1 = require("../licenses/licenses.module");
const users_module_1 = require("../users/users.module");
let ComplianceModule = class ComplianceModule {
};
exports.ComplianceModule = ComplianceModule;
exports.ComplianceModule = ComplianceModule = __decorate([
    (0, common_1.Module)({
        imports: [licenses_module_1.LicensesModule, users_module_1.UsersModule],
        controllers: [compliance_controller_1.ComplianceController],
        providers: [compliance_repository_1.ComplianceRepository, compliance_service_1.ComplianceService],
        exports: [compliance_repository_1.ComplianceRepository, compliance_service_1.ComplianceService],
    })
], ComplianceModule);
//# sourceMappingURL=compliance.module.js.map