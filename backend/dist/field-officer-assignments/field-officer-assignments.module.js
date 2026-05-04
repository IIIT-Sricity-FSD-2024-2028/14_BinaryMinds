"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FieldOfficerAssignmentsModule = void 0;
const common_1 = require("@nestjs/common");
const field_officer_assignments_repository_1 = require("./field-officer-assignments.repository");
const field_officer_assignments_service_1 = require("./field-officer-assignments.service");
const field_officer_assignments_controller_1 = require("./field-officer-assignments.controller");
const applications_module_1 = require("../applications/applications.module");
const users_module_1 = require("../users/users.module");
let FieldOfficerAssignmentsModule = class FieldOfficerAssignmentsModule {
};
exports.FieldOfficerAssignmentsModule = FieldOfficerAssignmentsModule;
exports.FieldOfficerAssignmentsModule = FieldOfficerAssignmentsModule = __decorate([
    (0, common_1.Module)({
        imports: [applications_module_1.ApplicationsModule, users_module_1.UsersModule],
        controllers: [field_officer_assignments_controller_1.FieldOfficerAssignmentsController],
        providers: [field_officer_assignments_repository_1.FieldOfficerAssignmentsRepository, field_officer_assignments_service_1.FieldOfficerAssignmentsService],
        exports: [field_officer_assignments_repository_1.FieldOfficerAssignmentsRepository, field_officer_assignments_service_1.FieldOfficerAssignmentsService],
    })
], FieldOfficerAssignmentsModule);
//# sourceMappingURL=field-officer-assignments.module.js.map