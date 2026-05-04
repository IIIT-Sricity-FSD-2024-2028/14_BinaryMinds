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
exports.LicensesController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const licenses_service_1 = require("./licenses.service");
const create_license_dto_1 = require("./dto/create-license.dto");
const update_license_dto_1 = require("./dto/update-license.dto");
const renew_license_dto_1 = require("./dto/renew-license.dto");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const roles_guard_1 = require("../common/guards/roles.guard");
const role_enum_1 = require("../common/enums/role.enum");
const swagger_1 = require("@nestjs/swagger");
let LicensesController = class LicensesController {
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
    findByApplication(applicationId) {
        return this.service.findByApplication(applicationId);
    }
    findByLicenseNumber(licenseNumber) {
        return this.service.findByLicenseNumber(licenseNumber);
    }
    findOne(id) {
        return this.service.findOne(id);
    }
    update(id, updateDto) {
        return this.service.update(id, updateDto);
    }
    suspend(id) {
        return this.service.suspend(id);
    }
    revoke(id) {
        return this.service.revoke(id);
    }
    renew(id, renewDto) {
        return this.service.renew(id, renewDto.new_expiry_date);
    }
    remove(id) {
        return this.service.remove(id);
    }
};
exports.LicensesController = LicensesController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.DEPARTMENT_OFFICER, role_enum_1.Role.SUPER_USER),
    openapi.ApiResponse({ status: 201, type: Object }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_license_dto_1.CreateLicenseDto]),
    __metadata("design:returntype", void 0)
], LicensesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.DEPARTMENT_OFFICER, role_enum_1.Role.SUPER_USER, role_enum_1.Role.FIELD_OFFICER),
    openapi.ApiResponse({ status: 200, type: [Object] }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], LicensesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('application/:applicationId'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.DEPARTMENT_OFFICER, role_enum_1.Role.SUPER_USER, role_enum_1.Role.FIELD_OFFICER, role_enum_1.Role.APPLICANT),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, common_1.Param)('applicationId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], LicensesController.prototype, "findByApplication", null);
__decorate([
    (0, common_1.Get)('number/:licenseNumber'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.DEPARTMENT_OFFICER, role_enum_1.Role.SUPER_USER, role_enum_1.Role.FIELD_OFFICER, role_enum_1.Role.APPLICANT),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, common_1.Param)('licenseNumber')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], LicensesController.prototype, "findByLicenseNumber", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.DEPARTMENT_OFFICER, role_enum_1.Role.SUPER_USER, role_enum_1.Role.FIELD_OFFICER, role_enum_1.Role.APPLICANT),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], LicensesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.DEPARTMENT_OFFICER, role_enum_1.Role.SUPER_USER),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_license_dto_1.UpdateLicenseDto]),
    __metadata("design:returntype", void 0)
], LicensesController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(':id/suspend'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.DEPARTMENT_OFFICER, role_enum_1.Role.SUPER_USER),
    openapi.ApiResponse({ status: 201, type: Object }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], LicensesController.prototype, "suspend", null);
__decorate([
    (0, common_1.Post)(':id/revoke'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.DEPARTMENT_OFFICER, role_enum_1.Role.SUPER_USER),
    openapi.ApiResponse({ status: 201, type: Object }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], LicensesController.prototype, "revoke", null);
__decorate([
    (0, common_1.Post)(':id/renew'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.DEPARTMENT_OFFICER, role_enum_1.Role.SUPER_USER),
    openapi.ApiResponse({ status: 201, type: Object }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, renew_license_dto_1.RenewLicenseDto]),
    __metadata("design:returntype", void 0)
], LicensesController.prototype, "renew", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.SUPER_USER),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], LicensesController.prototype, "remove", null);
exports.LicensesController = LicensesController = __decorate([
    (0, swagger_1.ApiTags)('Licenses'),
    (0, common_1.Controller)('licenses'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [licenses_service_1.LicensesService])
], LicensesController);
//# sourceMappingURL=licenses.controller.js.map