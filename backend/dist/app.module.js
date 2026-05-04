"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const users_module_1 = require("./users/users.module");
const applications_module_1 = require("./applications/applications.module");
const documents_module_1 = require("./documents/documents.module");
const document_verifications_module_1 = require("./document-verifications/document-verifications.module");
const payments_module_1 = require("./payments/payments.module");
const field_officer_assignments_module_1 = require("./field-officer-assignments/field-officer-assignments.module");
const inspections_module_1 = require("./inspections/inspections.module");
const department_reviews_module_1 = require("./department-reviews/department-reviews.module");
const licenses_module_1 = require("./licenses/licenses.module");
const compliance_module_1 = require("./compliance/compliance.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            users_module_1.UsersModule,
            applications_module_1.ApplicationsModule,
            documents_module_1.DocumentsModule,
            document_verifications_module_1.DocumentVerificationsModule,
            payments_module_1.PaymentsModule,
            field_officer_assignments_module_1.FieldOfficerAssignmentsModule,
            inspections_module_1.InspectionsModule,
            department_reviews_module_1.DepartmentReviewsModule,
            licenses_module_1.LicensesModule,
            compliance_module_1.ComplianceModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map