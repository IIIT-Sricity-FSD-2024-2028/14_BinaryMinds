"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DepartmentReviewsModule = void 0;
const common_1 = require("@nestjs/common");
const department_reviews_repository_1 = require("./department-reviews.repository");
const department_reviews_service_1 = require("./department-reviews.service");
const department_reviews_controller_1 = require("./department-reviews.controller");
const applications_module_1 = require("../applications/applications.module");
const users_module_1 = require("../users/users.module");
let DepartmentReviewsModule = class DepartmentReviewsModule {
};
exports.DepartmentReviewsModule = DepartmentReviewsModule;
exports.DepartmentReviewsModule = DepartmentReviewsModule = __decorate([
    (0, common_1.Module)({
        imports: [applications_module_1.ApplicationsModule, users_module_1.UsersModule],
        controllers: [department_reviews_controller_1.DepartmentReviewsController],
        providers: [department_reviews_repository_1.DepartmentReviewsRepository, department_reviews_service_1.DepartmentReviewsService],
        exports: [department_reviews_repository_1.DepartmentReviewsRepository, department_reviews_service_1.DepartmentReviewsService],
    })
], DepartmentReviewsModule);
//# sourceMappingURL=department-reviews.module.js.map