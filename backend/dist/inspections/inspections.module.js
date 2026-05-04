"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InspectionsModule = void 0;
const common_1 = require("@nestjs/common");
const inspections_repository_1 = require("./inspections.repository");
const inspections_service_1 = require("./inspections.service");
const inspections_controller_1 = require("./inspections.controller");
const field_officer_assignments_module_1 = require("../field-officer-assignments/field-officer-assignments.module");
let InspectionsModule = class InspectionsModule {
};
exports.InspectionsModule = InspectionsModule;
exports.InspectionsModule = InspectionsModule = __decorate([
    (0, common_1.Module)({
        imports: [field_officer_assignments_module_1.FieldOfficerAssignmentsModule],
        controllers: [inspections_controller_1.InspectionsController],
        providers: [inspections_repository_1.InspectionsRepository, inspections_service_1.InspectionsService],
        exports: [inspections_repository_1.InspectionsRepository, inspections_service_1.InspectionsService],
    })
], InspectionsModule);
//# sourceMappingURL=inspections.module.js.map