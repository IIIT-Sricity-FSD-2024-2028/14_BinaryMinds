"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LicensesModule = void 0;
const common_1 = require("@nestjs/common");
const licenses_repository_1 = require("./licenses.repository");
const licenses_service_1 = require("./licenses.service");
const licenses_controller_1 = require("./licenses.controller");
const applications_module_1 = require("../applications/applications.module");
const users_module_1 = require("../users/users.module");
let LicensesModule = class LicensesModule {
};
exports.LicensesModule = LicensesModule;
exports.LicensesModule = LicensesModule = __decorate([
    (0, common_1.Module)({
        imports: [applications_module_1.ApplicationsModule, users_module_1.UsersModule],
        controllers: [licenses_controller_1.LicensesController],
        providers: [licenses_repository_1.LicensesRepository, licenses_service_1.LicensesService],
        exports: [licenses_repository_1.LicensesRepository, licenses_service_1.LicensesService],
    })
], LicensesModule);
//# sourceMappingURL=licenses.module.js.map