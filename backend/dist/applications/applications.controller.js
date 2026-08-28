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
exports.ApplicationsController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const applications_service_1 = require("./applications.service");
const create_application_dto_1 = require("./dto/create-application.dto");
const create_simple_application_dto_1 = require("./dto/create-simple-application.dto");
const update_application_dto_1 = require("./dto/update-application.dto");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const roles_guard_1 = require("../common/guards/roles.guard");
const role_enum_1 = require("../common/enums/role.enum");
const swagger_1 = require("@nestjs/swagger");
const api_route_decorator_1 = require("../common/swagger/api-route.decorator");
const audit_logs_service_1 = require("../audit-logs/audit-logs.service");
let ApplicationsController = class ApplicationsController {
    applicationsService;
    auditLogsService;
    constructor(applicationsService, auditLogsService) {
        this.applicationsService = applicationsService;
        this.auditLogsService = auditLogsService;
    }
    create(body, request) {
        if ('applicantName' in body && !('applicant_id' in body)) {
            const app = this.applicationsService.createSimple(body, request.user.userId);
            this.auditLogsService.log({
                user_name: app.full_name || body.applicantName || 'Applicant',
                role: 'applicant',
                action: 'Create',
                module: 'Applications',
                description: `Created application ${app.application_id}`,
                ip_address: '127.0.0.1',
                source: 'backend',
            });
            return { success: true, data: app };
        }
        const app = this.applicationsService.create(body);
        this.auditLogsService.log({
            user_name: app.full_name || 'Applicant',
            role: 'applicant',
            action: 'Create',
            module: 'Applications',
            description: `Created application ${app.application_id}`,
            ip_address: '127.0.0.1',
            source: 'backend',
        });
        return { success: true, data: app };
    }
    findSubmitted() {
        return {
            success: true,
            data: this.applicationsService.findSubmitted(),
        };
    }
    assign(id, officerId) {
        const app = this.applicationsService.assignToOfficer(id, officerId ? Number(officerId) : undefined);
        this.auditLogsService.log({
            user_name: 'Super User',
            role: 'superuser',
            action: 'Update',
            module: 'Applications',
            description: `Assigned application ${id} to officer ${app.assignedOfficerId}`,
            ip_address: '127.0.0.1',
            source: 'backend',
        });
        return {
            success: true,
            data: app,
        };
    }
    findByOfficer(officerId) {
        return {
            success: true,
            data: this.applicationsService.findByOfficer(officerId),
        };
    }
    verify(id) {
        const app = this.applicationsService.verify(id);
        this.auditLogsService.log({
            user_name: 'Field Officer',
            role: 'field_officer',
            action: 'Update',
            module: 'Applications',
            description: `Verified application ${id}`,
            ip_address: '127.0.0.1',
            source: 'backend',
        });
        return {
            success: true,
            data: app,
        };
    }
    findAll() {
        return { success: true, data: this.applicationsService.findAll() };
    }
    findByApplicant(applicantId, request) {
        if (request.user.role === role_enum_1.Role.APPLICANT && request.user.userId !== applicantId) {
            throw new common_1.ForbiddenException('Applicants can only view their own applications');
        }
        return { success: true, data: this.applicationsService.findByApplicant(applicantId) };
    }
    findMine(request) {
        return {
            success: true,
            data: this.applicationsService.findByApplicant(request.user.userId),
        };
    }
    findOne(id) {
        return { success: true, data: this.applicationsService.findOne(id) };
    }
    update(id, updateApplicationDto) {
        const app = this.applicationsService.update(id, updateApplicationDto);
        this.auditLogsService.log({
            user_name: 'System User',
            role: 'system',
            action: 'Update',
            module: 'Applications',
            description: `Updated application ${id}`,
            ip_address: '127.0.0.1',
            source: 'backend',
        });
        return { success: true, data: app };
    }
    remove(id) {
        this.applicationsService.remove(id);
        this.auditLogsService.log({
            user_name: 'Department Officer',
            role: 'department_officer',
            action: 'Delete',
            module: 'Applications',
            description: `Deleted application ${id}`,
            ip_address: '127.0.0.1',
            source: 'backend',
        });
        return { success: true, data: null };
    }
};
exports.ApplicationsController = ApplicationsController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.APPLICANT, role_enum_1.Role.DEPARTMENT_OFFICER, role_enum_1.Role.SUPER_USER),
    (0, api_route_decorator_1.ApiRoute)({
        summary: 'Create a new application',
        description: 'Accepts either the full application payload or the simplified applicant workflow payload.',
        roles: [role_enum_1.Role.APPLICANT, role_enum_1.Role.DEPARTMENT_OFFICER, role_enum_1.Role.SUPER_USER],
        bodyTypes: [create_application_dto_1.CreateApplicationDto, create_simple_application_dto_1.CreateSimpleApplicationDto],
        status: 201,
        responseDescription: 'Application created.',
        wrappedResponse: true,
        responseExample: { application_id: 1, application_status: 'submitted' },
        notFound: true,
    }),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ApplicationsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('submitted'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.SUPER_USER),
    (0, api_route_decorator_1.ApiRoute)({
        summary: 'List submitted paid applications',
        roles: [role_enum_1.Role.SUPER_USER],
        responseDescription: 'Submitted applications with paymentDone set to true.',
        wrappedResponse: true,
        responseExample: [{ application_id: 1, application_status: 'submitted', paymentDone: true }],
    }),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ApplicationsController.prototype, "findSubmitted", null);
__decorate([
    (0, common_1.Patch)(':id/assign'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.SUPER_USER),
    (0, api_route_decorator_1.ApiRoute)({
        summary: 'Assign an application to a field officer',
        description: 'When officerId is omitted, the application is assigned to the least-loaded officer.',
        roles: [role_enum_1.Role.SUPER_USER],
        params: [{ name: 'id', description: 'Application ID' }],
        bodySchema: {
            type: 'object',
            properties: {
                officerId: { type: 'number', example: 2, nullable: true },
            },
        },
        responseDescription: 'Assigned application.',
        wrappedResponse: true,
        responseExample: { application_id: 1, assignedOfficerId: 2, application_status: 'assigned' },
    }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)('officerId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", void 0)
], ApplicationsController.prototype, "assign", null);
__decorate([
    (0, common_1.Get)('officer/:officerId'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.FIELD_OFFICER, role_enum_1.Role.SUPER_USER),
    (0, api_route_decorator_1.ApiRoute)({
        summary: 'List applications assigned to an officer',
        roles: [role_enum_1.Role.FIELD_OFFICER, role_enum_1.Role.SUPER_USER],
        params: [{ name: 'officerId', description: 'Field officer user ID' }],
        wrappedResponse: true,
        responseExample: [{ application_id: 1, assignedOfficerId: 2 }],
    }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('officerId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], ApplicationsController.prototype, "findByOfficer", null);
__decorate([
    (0, common_1.Patch)(':id/verify'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.FIELD_OFFICER),
    (0, api_route_decorator_1.ApiRoute)({
        summary: 'Mark an assigned application as verified',
        roles: [role_enum_1.Role.FIELD_OFFICER],
        params: [{ name: 'id', description: 'Application ID' }],
        wrappedResponse: true,
        responseExample: { application_id: 1, application_status: 'verified' },
    }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], ApplicationsController.prototype, "verify", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.DEPARTMENT_OFFICER, role_enum_1.Role.FIELD_OFFICER, role_enum_1.Role.SUPER_USER),
    (0, api_route_decorator_1.ApiRoute)({
        summary: 'List all applications',
        roles: [role_enum_1.Role.DEPARTMENT_OFFICER, role_enum_1.Role.FIELD_OFFICER, role_enum_1.Role.SUPER_USER],
        wrappedResponse: true,
        responseExample: [{ application_id: 1, business_name: 'Registered Business Name' }],
    }),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ApplicationsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('applicant/:applicantId'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.APPLICANT, role_enum_1.Role.DEPARTMENT_OFFICER, role_enum_1.Role.FIELD_OFFICER),
    (0, api_route_decorator_1.ApiRoute)({
        summary: 'List applications for an applicant',
        roles: [role_enum_1.Role.APPLICANT, role_enum_1.Role.DEPARTMENT_OFFICER, role_enum_1.Role.FIELD_OFFICER],
        params: [{ name: 'applicantId', description: 'Applicant user ID' }],
        wrappedResponse: true,
        responseExample: [{ application_id: 1, applicant_id: 3 }],
    }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('applicantId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], ApplicationsController.prototype, "findByApplicant", null);
__decorate([
    (0, common_1.Get)('mine'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.APPLICANT),
    (0, api_route_decorator_1.ApiRoute)({
        summary: 'List applications for the authenticated applicant',
        roles: [role_enum_1.Role.APPLICANT],
        wrappedResponse: true,
        responseExample: [{ application_id: 1, applicant_id: 3 }],
    }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ApplicationsController.prototype, "findMine", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.APPLICANT, role_enum_1.Role.DEPARTMENT_OFFICER, role_enum_1.Role.FIELD_OFFICER, role_enum_1.Role.SUPER_USER),
    (0, api_route_decorator_1.ApiRoute)({
        summary: 'Get application by ID',
        roles: [role_enum_1.Role.APPLICANT, role_enum_1.Role.DEPARTMENT_OFFICER, role_enum_1.Role.FIELD_OFFICER, role_enum_1.Role.SUPER_USER],
        params: [{ name: 'id', description: 'Application ID' }],
        wrappedResponse: true,
        responseExample: { application_id: 1, business_name: 'Registered Business Name' },
    }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], ApplicationsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.DEPARTMENT_OFFICER, role_enum_1.Role.FIELD_OFFICER, role_enum_1.Role.APPLICANT),
    (0, api_route_decorator_1.ApiRoute)({
        summary: 'Update application by ID',
        roles: [role_enum_1.Role.DEPARTMENT_OFFICER, role_enum_1.Role.FIELD_OFFICER, role_enum_1.Role.APPLICANT],
        params: [{ name: 'id', description: 'Application ID' }],
        bodyType: update_application_dto_1.UpdateApplicationDto,
        wrappedResponse: true,
        responseExample: { application_id: 1, application_status: 'assigned' },
    }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_application_dto_1.UpdateApplicationDto]),
    __metadata("design:returntype", void 0)
], ApplicationsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.DEPARTMENT_OFFICER),
    (0, api_route_decorator_1.ApiRoute)({
        summary: 'Delete application by ID',
        roles: [role_enum_1.Role.DEPARTMENT_OFFICER],
        params: [{ name: 'id', description: 'Application ID' }],
        wrappedResponse: true,
        responseExample: null,
    }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], ApplicationsController.prototype, "remove", null);
exports.ApplicationsController = ApplicationsController = __decorate([
    (0, swagger_1.ApiTags)('Applications'),
    (0, swagger_1.ApiExtraModels)(create_application_dto_1.CreateApplicationDto, create_simple_application_dto_1.CreateSimpleApplicationDto),
    (0, common_1.Controller)('applications'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [applications_service_1.ApplicationsService,
        audit_logs_service_1.AuditLogsService])
], ApplicationsController);
//# sourceMappingURL=applications.controller.js.map