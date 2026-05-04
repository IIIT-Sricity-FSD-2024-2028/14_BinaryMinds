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
const update_application_dto_1 = require("./dto/update-application.dto");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const roles_guard_1 = require("../common/guards/roles.guard");
const role_enum_1 = require("../common/enums/role.enum");
const swagger_1 = require("@nestjs/swagger");
let ApplicationsController = class ApplicationsController {
    applicationsService;
    constructor(applicationsService) {
        this.applicationsService = applicationsService;
    }
    create(createApplicationDto) {
        return this.applicationsService.create(createApplicationDto);
    }
    findAll() {
        return this.applicationsService.findAll();
    }
    findByApplicant(applicantId) {
        return this.applicationsService.findByApplicant(applicantId);
    }
    findOne(id) {
        return this.applicationsService.findOne(id);
    }
    update(id, updateApplicationDto) {
        return this.applicationsService.update(id, updateApplicationDto);
    }
    remove(id) {
        return this.applicationsService.remove(id);
    }
};
exports.ApplicationsController = ApplicationsController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.APPLICANT, role_enum_1.Role.DEPARTMENT_OFFICER),
    openapi.ApiResponse({ status: 201, type: Object }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_application_dto_1.CreateApplicationDto]),
    __metadata("design:returntype", void 0)
], ApplicationsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.DEPARTMENT_OFFICER, role_enum_1.Role.FIELD_OFFICER),
    openapi.ApiResponse({ status: 200, type: [Object] }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ApplicationsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('applicant/:applicantId'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.APPLICANT, role_enum_1.Role.DEPARTMENT_OFFICER, role_enum_1.Role.FIELD_OFFICER),
    openapi.ApiResponse({ status: 200, type: [Object] }),
    __param(0, (0, common_1.Param)('applicantId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], ApplicationsController.prototype, "findByApplicant", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.APPLICANT, role_enum_1.Role.DEPARTMENT_OFFICER, role_enum_1.Role.FIELD_OFFICER),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], ApplicationsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.DEPARTMENT_OFFICER, role_enum_1.Role.FIELD_OFFICER, role_enum_1.Role.APPLICANT),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_application_dto_1.UpdateApplicationDto]),
    __metadata("design:returntype", void 0)
], ApplicationsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.DEPARTMENT_OFFICER),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], ApplicationsController.prototype, "remove", null);
exports.ApplicationsController = ApplicationsController = __decorate([
    (0, swagger_1.ApiTags)('Applications'),
    (0, common_1.Controller)('applications'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [applications_service_1.ApplicationsService])
], ApplicationsController);
//# sourceMappingURL=applications.controller.js.map