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
exports.InspectionsController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const inspections_service_1 = require("./inspections.service");
const create_inspection_dto_1 = require("./dto/create-inspection.dto");
const update_inspection_dto_1 = require("./dto/update-inspection.dto");
const submit_inspection_report_dto_1 = require("./dto/submit-inspection-report.dto");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const roles_guard_1 = require("../common/guards/roles.guard");
const role_enum_1 = require("../common/enums/role.enum");
const swagger_1 = require("@nestjs/swagger");
const api_route_decorator_1 = require("../common/swagger/api-route.decorator");
const audit_logs_service_1 = require("../audit-logs/audit-logs.service");
let InspectionsController = class InspectionsController {
    service;
    auditLogsService;
    constructor(service, auditLogsService) {
        this.service = service;
        this.auditLogsService = auditLogsService;
    }
    create(createDto) {
        const inspection = this.service.create(createDto);
        this.auditLogsService.log({
            user_name: 'Field Officer',
            role: 'field_officer',
            action: 'Create',
            module: 'Inspections',
            description: `Created inspection ${inspection.inspection_id}`,
            ip_address: '127.0.0.1',
            source: 'backend',
        });
        return inspection;
    }
    findAll() {
        return this.service.findAll();
    }
    findByAssignment(assignmentId) {
        return this.service.findByAssignment(assignmentId);
    }
    findByFieldOfficer(fieldOfficerId) {
        return this.service.findByFieldOfficer(fieldOfficerId);
    }
    findOne(id) {
        return this.service.findOne(id);
    }
    update(id, updateDto) {
        const inspection = this.service.update(id, updateDto);
        this.auditLogsService.log({
            user_name: 'Field Officer',
            role: 'field_officer',
            action: 'Update',
            module: 'Inspections',
            description: `Updated inspection ${id}`,
            ip_address: '127.0.0.1',
            source: 'backend',
        });
        return inspection;
    }
    submitReport(id, reportDto) {
        return this.service.submitReport(id, reportDto);
    }
    remove(id) {
        return this.service.remove(id);
    }
};
exports.InspectionsController = InspectionsController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.DEPARTMENT_OFFICER, role_enum_1.Role.FIELD_OFFICER),
    (0, api_route_decorator_1.ApiRoute)({
        summary: 'Create inspection',
        roles: [role_enum_1.Role.DEPARTMENT_OFFICER, role_enum_1.Role.FIELD_OFFICER],
        bodyType: create_inspection_dto_1.CreateInspectionDto,
        status: 201,
        responseExample: { inspection_id: 1, assignment_id: 1, status: 'scheduled' },
    }),
    openapi.ApiResponse({ status: 201, type: Object }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_inspection_dto_1.CreateInspectionDto]),
    __metadata("design:returntype", void 0)
], InspectionsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.DEPARTMENT_OFFICER, role_enum_1.Role.FIELD_OFFICER),
    (0, api_route_decorator_1.ApiRoute)({
        summary: 'List inspections',
        roles: [role_enum_1.Role.DEPARTMENT_OFFICER, role_enum_1.Role.FIELD_OFFICER],
        responseExample: [{ inspection_id: 1, assignment_id: 1 }],
    }),
    openapi.ApiResponse({ status: 200, type: [Object] }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], InspectionsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('assignment/:assignmentId'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.DEPARTMENT_OFFICER, role_enum_1.Role.FIELD_OFFICER),
    (0, api_route_decorator_1.ApiRoute)({
        summary: 'List inspections by assignment',
        roles: [role_enum_1.Role.DEPARTMENT_OFFICER, role_enum_1.Role.FIELD_OFFICER],
        params: [{ name: 'assignmentId', description: 'Assignment ID' }],
        responseExample: [{ inspection_id: 1, assignment_id: 1 }],
    }),
    openapi.ApiResponse({ status: 200, type: [Object] }),
    __param(0, (0, common_1.Param)('assignmentId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], InspectionsController.prototype, "findByAssignment", null);
__decorate([
    (0, common_1.Get)('field-officer/:fieldOfficerId'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.DEPARTMENT_OFFICER, role_enum_1.Role.FIELD_OFFICER),
    (0, api_route_decorator_1.ApiRoute)({
        summary: 'List inspections by field officer',
        roles: [role_enum_1.Role.DEPARTMENT_OFFICER, role_enum_1.Role.FIELD_OFFICER],
        params: [{ name: 'fieldOfficerId', description: 'Field officer user ID' }],
        responseExample: [{ inspection_id: 1, field_officer_id: 2 }],
    }),
    openapi.ApiResponse({ status: 200, type: [Object] }),
    __param(0, (0, common_1.Param)('fieldOfficerId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], InspectionsController.prototype, "findByFieldOfficer", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.DEPARTMENT_OFFICER, role_enum_1.Role.FIELD_OFFICER),
    (0, api_route_decorator_1.ApiRoute)({
        summary: 'Get inspection by ID',
        roles: [role_enum_1.Role.DEPARTMENT_OFFICER, role_enum_1.Role.FIELD_OFFICER],
        params: [{ name: 'id', description: 'Inspection ID' }],
        responseExample: { inspection_id: 1, status: 'scheduled' },
    }),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], InspectionsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.DEPARTMENT_OFFICER, role_enum_1.Role.FIELD_OFFICER),
    (0, api_route_decorator_1.ApiRoute)({
        summary: 'Update inspection by ID',
        roles: [role_enum_1.Role.DEPARTMENT_OFFICER, role_enum_1.Role.FIELD_OFFICER],
        params: [{ name: 'id', description: 'Inspection ID' }],
        bodyType: update_inspection_dto_1.UpdateInspectionDto,
        responseExample: { inspection_id: 1, status: 'completed' },
    }),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_inspection_dto_1.UpdateInspectionDto]),
    __metadata("design:returntype", void 0)
], InspectionsController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(':id/report'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.FIELD_OFFICER, role_enum_1.Role.DEPARTMENT_OFFICER),
    (0, api_route_decorator_1.ApiRoute)({
        summary: 'Submit inspection report',
        roles: [role_enum_1.Role.FIELD_OFFICER, role_enum_1.Role.DEPARTMENT_OFFICER],
        params: [{ name: 'id', description: 'Inspection ID' }],
        bodyType: submit_inspection_report_dto_1.SubmitInspectionReportDto,
        status: 201,
        responseExample: { inspection_id: 1, status: 'completed', result: 'approved' },
    }),
    openapi.ApiResponse({ status: 201, type: Object }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, submit_inspection_report_dto_1.SubmitInspectionReportDto]),
    __metadata("design:returntype", void 0)
], InspectionsController.prototype, "submitReport", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.DEPARTMENT_OFFICER),
    (0, api_route_decorator_1.ApiRoute)({
        summary: 'Delete inspection by ID',
        roles: [role_enum_1.Role.DEPARTMENT_OFFICER],
        params: [{ name: 'id', description: 'Inspection ID' }],
        responseExample: true,
    }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], InspectionsController.prototype, "remove", null);
exports.InspectionsController = InspectionsController = __decorate([
    (0, swagger_1.ApiTags)('Inspections'),
    (0, common_1.Controller)('inspections'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [inspections_service_1.InspectionsService,
        audit_logs_service_1.AuditLogsService])
], InspectionsController);
//# sourceMappingURL=inspections.controller.js.map