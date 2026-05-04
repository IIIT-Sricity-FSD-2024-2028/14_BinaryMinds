"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApplicationsModule = void 0;
const common_1 = require("@nestjs/common");
const users_module_1 = require("../users/users.module");
const applications_service_1 = require("./applications.service");
const applications_repository_1 = require("./applications.repository");
const applications_controller_1 = require("./applications.controller");
let ApplicationsModule = class ApplicationsModule {
};
exports.ApplicationsModule = ApplicationsModule;
exports.ApplicationsModule = ApplicationsModule = __decorate([
    (0, common_1.Module)({
        imports: [users_module_1.UsersModule],
        controllers: [applications_controller_1.ApplicationsController],
        providers: [applications_service_1.ApplicationsService, applications_repository_1.ApplicationsRepository],
        exports: [applications_service_1.ApplicationsService],
    })
], ApplicationsModule);
//# sourceMappingURL=applications.module.js.map