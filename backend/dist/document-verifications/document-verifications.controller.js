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
exports.DocumentVerificationsController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const document_verifications_service_1 = require("./document-verifications.service");
const create_document_verification_dto_1 = require("./dto/create-document-verification.dto");
const update_document_verification_dto_1 = require("./dto/update-document-verification.dto");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const roles_guard_1 = require("../common/guards/roles.guard");
const role_enum_1 = require("../common/enums/role.enum");
const swagger_1 = require("@nestjs/swagger");
let DocumentVerificationsController = class DocumentVerificationsController {
    verificationsService;
    constructor(verificationsService) {
        this.verificationsService = verificationsService;
    }
    create(createDto) {
        return this.verificationsService.create(createDto);
    }
    findAll() {
        return this.verificationsService.findAll();
    }
    findByApplication(applicationId) {
        return this.verificationsService.findByApplication(applicationId);
    }
    findByFieldOfficer(foId) {
        return this.verificationsService.findByFieldOfficer(foId);
    }
    findOne(id) {
        return this.verificationsService.findOne(id);
    }
    update(id, updateDto) {
        return this.verificationsService.update(id, updateDto);
    }
    remove(id) {
        return this.verificationsService.remove(id);
    }
};
exports.DocumentVerificationsController = DocumentVerificationsController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.FIELD_OFFICER, role_enum_1.Role.DEPARTMENT_OFFICER),
    openapi.ApiResponse({ status: 201, type: Object }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_document_verification_dto_1.CreateDocumentVerificationDto]),
    __metadata("design:returntype", void 0)
], DocumentVerificationsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.DEPARTMENT_OFFICER),
    openapi.ApiResponse({ status: 200, type: [Object] }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], DocumentVerificationsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('application/:applicationId'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.FIELD_OFFICER, role_enum_1.Role.DEPARTMENT_OFFICER, role_enum_1.Role.APPLICANT),
    openapi.ApiResponse({ status: 200, type: [Object] }),
    __param(0, (0, common_1.Param)('applicationId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], DocumentVerificationsController.prototype, "findByApplication", null);
__decorate([
    (0, common_1.Get)('field-officer/:foId'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.FIELD_OFFICER, role_enum_1.Role.DEPARTMENT_OFFICER),
    openapi.ApiResponse({ status: 200, type: [Object] }),
    __param(0, (0, common_1.Param)('foId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], DocumentVerificationsController.prototype, "findByFieldOfficer", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.FIELD_OFFICER, role_enum_1.Role.DEPARTMENT_OFFICER),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], DocumentVerificationsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.FIELD_OFFICER, role_enum_1.Role.DEPARTMENT_OFFICER),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_document_verification_dto_1.UpdateDocumentVerificationDto]),
    __metadata("design:returntype", void 0)
], DocumentVerificationsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.DEPARTMENT_OFFICER),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], DocumentVerificationsController.prototype, "remove", null);
exports.DocumentVerificationsController = DocumentVerificationsController = __decorate([
    (0, swagger_1.ApiTags)('Document Verifications'),
    (0, common_1.Controller)('document-verifications'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [document_verifications_service_1.DocumentVerificationsService])
], DocumentVerificationsController);
//# sourceMappingURL=document-verifications.controller.js.map