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
exports.DepartmentReviewsController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const department_reviews_service_1 = require("./department-reviews.service");
const create_department_review_dto_1 = require("./dto/create-department-review.dto");
const update_department_review_dto_1 = require("./dto/update-department-review.dto");
const sign_review_dto_1 = require("./dto/sign-review.dto");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const roles_guard_1 = require("../common/guards/roles.guard");
const role_enum_1 = require("../common/enums/role.enum");
const swagger_1 = require("@nestjs/swagger");
let DepartmentReviewsController = class DepartmentReviewsController {
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
    findByReviewer(reviewerId) {
        return this.service.findByReviewer(reviewerId);
    }
    findOne(id) {
        return this.service.findOne(id);
    }
    update(id, updateDto) {
        return this.service.update(id, updateDto);
    }
    signReview(id, signDto) {
        return this.service.signReview(id, signDto.digital_signature);
    }
    remove(id) {
        return this.service.remove(id);
    }
};
exports.DepartmentReviewsController = DepartmentReviewsController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.DEPARTMENT_OFFICER),
    openapi.ApiResponse({ status: 201, type: Object }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_department_review_dto_1.CreateDepartmentReviewDto]),
    __metadata("design:returntype", void 0)
], DepartmentReviewsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.DEPARTMENT_OFFICER, role_enum_1.Role.SUPER_USER),
    openapi.ApiResponse({ status: 200, type: [Object] }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], DepartmentReviewsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('application/:applicationId'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.DEPARTMENT_OFFICER, role_enum_1.Role.FIELD_OFFICER, role_enum_1.Role.APPLICANT),
    openapi.ApiResponse({ status: 200, type: [Object] }),
    __param(0, (0, common_1.Param)('applicationId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], DepartmentReviewsController.prototype, "findByApplication", null);
__decorate([
    (0, common_1.Get)('reviewer/:reviewerId'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.DEPARTMENT_OFFICER, role_enum_1.Role.SUPER_USER),
    openapi.ApiResponse({ status: 200, type: [Object] }),
    __param(0, (0, common_1.Param)('reviewerId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], DepartmentReviewsController.prototype, "findByReviewer", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.DEPARTMENT_OFFICER, role_enum_1.Role.FIELD_OFFICER, role_enum_1.Role.APPLICANT),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], DepartmentReviewsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.DEPARTMENT_OFFICER),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_department_review_dto_1.UpdateDepartmentReviewDto]),
    __metadata("design:returntype", void 0)
], DepartmentReviewsController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(':id/sign'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.DEPARTMENT_OFFICER),
    openapi.ApiResponse({ status: 201, type: Object }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, sign_review_dto_1.SignReviewDto]),
    __metadata("design:returntype", void 0)
], DepartmentReviewsController.prototype, "signReview", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.SUPER_USER),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], DepartmentReviewsController.prototype, "remove", null);
exports.DepartmentReviewsController = DepartmentReviewsController = __decorate([
    (0, swagger_1.ApiTags)('Department Reviews'),
    (0, common_1.Controller)('department-reviews'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [department_reviews_service_1.DepartmentReviewsService])
], DepartmentReviewsController);
//# sourceMappingURL=department-reviews.controller.js.map