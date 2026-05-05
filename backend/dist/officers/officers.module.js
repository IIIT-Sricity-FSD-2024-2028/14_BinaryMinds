"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OfficersModule = void 0;
const common_1 = require("@nestjs/common");
const officers_controller_1 = require("./officers.controller");
const officers_service_1 = require("./officers.service");
const officers_repository_1 = require("./officers.repository");
const applications_module_1 = require("../applications/applications.module");
let OfficersModule = class OfficersModule {
};
exports.OfficersModule = OfficersModule;
exports.OfficersModule = OfficersModule = __decorate([
    (0, common_1.Module)({
        imports: [(0, common_1.forwardRef)(() => applications_module_1.ApplicationsModule)],
        controllers: [officers_controller_1.OfficersController],
        providers: [officers_service_1.OfficersService, officers_repository_1.OfficersRepository],
        exports: [officers_service_1.OfficersService, officers_repository_1.OfficersRepository],
    })
], OfficersModule);
//# sourceMappingURL=officers.module.js.map