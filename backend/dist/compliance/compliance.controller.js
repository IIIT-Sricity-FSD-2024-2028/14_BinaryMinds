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
exports.ComplianceController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const compliance_service_1 = require("./compliance.service");
const create_compliance_record_dto_1 = require("./dto/create-compliance-record.dto");
const update_compliance_record_dto_1 = require("./dto/update-compliance-record.dto");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const roles_guard_1 = require("../common/guards/roles.guard");
const role_enum_1 = require("../common/enums/role.enum");
const swagger_1 = require("@nestjs/swagger");
const api_route_decorator_1 = require("../common/swagger/api-route.decorator");
let ComplianceController = class ComplianceController {
    service;
    constructor(service) {
        this.service = service;
    }
    create(createDto) {
        return this.service.create(createDto);
    }
    findAll() {
        return this.service.findAll();
    }
    findByLicense(licenseId) {
        return this.service.findByLicense(licenseId);
    }
    findByFieldOfficer(fieldOfficerId) {
        return this.service.findByFieldOfficer(fieldOfficerId);
    }
    findOne(id) {
        return this.service.findOne(id);
    }
    update(id, updateDto) {
        return this.service.update(id, updateDto);
    }
    resolveWarning(id) {
        return this.service.resolveWarning(id);
    }
    escalateWarning(id) {
        return this.service.escalateWarning(id);
    }
    remove(id) {
        return this.service.remove(id);
    }
};
exports.ComplianceController = ComplianceController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.FIELD_OFFICER, role_enum_1.Role.DEPARTMENT_OFFICER, role_enum_1.Role.SUPER_USER),
    (0, api_route_decorator_1.ApiRoute)({
        summary: 'Create compliance record',
        roles: [role_enum_1.Role.FIELD_OFFICER, role_enum_1.Role.DEPARTMENT_OFFICER, role_enum_1.Role.SUPER_USER],
        bodyType: create_compliance_record_dto_1.CreateComplianceRecordDto,
        status: 201,
        responseExample: { compliance_id: 1, compliance_status: 'pending' },
    }),
    openapi.ApiResponse({ status: 201, type: Object }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_compliance_record_dto_1.CreateComplianceRecordDto]),
    __metadata("design:returntype", void 0)
], ComplianceController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.DEPARTMENT_OFFICER, role_enum_1.Role.SUPER_USER),
    (0, api_route_decorator_1.ApiRoute)({
        summary: 'List compliance records',
        roles: [role_enum_1.Role.DEPARTMENT_OFFICER, role_enum_1.Role.SUPER_USER],
        responseExample: [{ compliance_id: 1, license_id: 1 }],
    }),
    openapi.ApiResponse({ status: 200, type: [Object] }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ComplianceController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('license/:licenseId'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.DEPARTMENT_OFFICER, role_enum_1.Role.SUPER_USER, role_enum_1.Role.FIELD_OFFICER, role_enum_1.Role.APPLICANT),
    (0, api_route_decorator_1.ApiRoute)({
        summary: 'List compliance records by license',
        roles: [role_enum_1.Role.DEPARTMENT_OFFICER, role_enum_1.Role.SUPER_USER, role_enum_1.Role.FIELD_OFFICER, role_enum_1.Role.APPLICANT],
        params: [{ name: 'licenseId', description: 'License ID' }],
        responseExample: [{ compliance_id: 1, license_id: 1 }],
    }),
    openapi.ApiResponse({ status: 200, type: [Object] }),
    __param(0, (0, common_1.Param)('licenseId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], ComplianceController.prototype, "findByLicense", null);
__decorate([
    (0, common_1.Get)('field-officer/:fieldOfficerId'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.DEPARTMENT_OFFICER, role_enum_1.Role.SUPER_USER, role_enum_1.Role.FIELD_OFFICER),
    (0, api_route_decorator_1.ApiRoute)({
        summary: 'List compliance records by field officer',
        roles: [role_enum_1.Role.DEPARTMENT_OFFICER, role_enum_1.Role.SUPER_USER, role_enum_1.Role.FIELD_OFFICER],
        params: [{ name: 'fieldOfficerId', description: 'Field officer user ID' }],
        responseExample: [{ compliance_id: 1, field_officer_id: 2 }],
    }),
    openapi.ApiResponse({ status: 200, type: [Object] }),
    __param(0, (0, common_1.Param)('fieldOfficerId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], ComplianceController.prototype, "findByFieldOfficer", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.DEPARTMENT_OFFICER, role_enum_1.Role.SUPER_USER, role_enum_1.Role.FIELD_OFFICER, role_enum_1.Role.APPLICANT),
    (0, api_route_decorator_1.ApiRoute)({
        summary: 'Get compliance record by ID',
        roles: [role_enum_1.Role.DEPARTMENT_OFFICER, role_enum_1.Role.SUPER_USER, role_enum_1.Role.FIELD_OFFICER, role_enum_1.Role.APPLICANT],
        params: [{ name: 'id', description: 'Compliance record ID' }],
        responseExample: { compliance_id: 1, compliance_status: 'pending' },
    }),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], ComplianceController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.FIELD_OFFICER, role_enum_1.Role.DEPARTMENT_OFFICER, role_enum_1.Role.SUPER_USER),
    (0, api_route_decorator_1.ApiRoute)({
        summary: 'Update compliance record by ID',
        roles: [role_enum_1.Role.FIELD_OFFICER, role_enum_1.Role.DEPARTMENT_OFFICER, role_enum_1.Role.SUPER_USER],
        params: [{ name: 'id', description: 'Compliance record ID' }],
        bodyType: update_compliance_record_dto_1.UpdateComplianceRecordDto,
        responseExample: { compliance_id: 1, compliance_status: 'resolved' },
    }),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_compliance_record_dto_1.UpdateComplianceRecordDto]),
    __metadata("design:returntype", void 0)
], ComplianceController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(':id/resolve'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.FIELD_OFFICER, role_enum_1.Role.DEPARTMENT_OFFICER, role_enum_1.Role.SUPER_USER),
    (0, api_route_decorator_1.ApiRoute)({
        summary: 'Resolve compliance warning',
        roles: [role_enum_1.Role.FIELD_OFFICER, role_enum_1.Role.DEPARTMENT_OFFICER, role_enum_1.Role.SUPER_USER],
        params: [{ name: 'id', description: 'Compliance record ID' }],
        status: 201,
        responseExample: { compliance_id: 1, compliance_status: 'resolved' },
    }),
    openapi.ApiResponse({ status: 201, type: Object }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], ComplianceController.prototype, "resolveWarning", null);
__decorate([
    (0, common_1.Post)(':id/escalate'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.FIELD_OFFICER, role_enum_1.Role.DEPARTMENT_OFFICER, role_enum_1.Role.SUPER_USER),
    (0, api_route_decorator_1.ApiRoute)({
        summary: 'Escalate compliance warning',
        roles: [role_enum_1.Role.FIELD_OFFICER, role_enum_1.Role.DEPARTMENT_OFFICER, role_enum_1.Role.SUPER_USER],
        params: [{ name: 'id', description: 'Compliance record ID' }],
        status: 201,
        responseExample: { compliance_id: 1, compliance_status: 'escalated' },
    }),
    openapi.ApiResponse({ status: 201, type: Object }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], ComplianceController.prototype, "escalateWarning", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.SUPER_USER),
    (0, api_route_decorator_1.ApiRoute)({
        summary: 'Delete compliance record by ID',
        roles: [role_enum_1.Role.SUPER_USER],
        params: [{ name: 'id', description: 'Compliance record ID' }],
        responseExample: true,
    }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], ComplianceController.prototype, "remove", null);
exports.ComplianceController = ComplianceController = __decorate([
    (0, swagger_1.ApiTags)('Compliance'),
    (0, common_1.Controller)('compliance'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [compliance_service_1.ComplianceService])
], ComplianceController);
//# sourceMappingURL=compliance.controller.js.map