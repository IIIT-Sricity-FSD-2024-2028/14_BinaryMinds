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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DepartmentReviewsService = void 0;
const common_1 = require("@nestjs/common");
const department_reviews_repository_1 = require("./department-reviews.repository");
const review_status_enum_1 = require("../common/enums/review-status.enum");
const applications_service_1 = require("../applications/applications.service");
const users_service_1 = require("../users/users.service");
let DepartmentReviewsService = class DepartmentReviewsService {
    repository;
    applicationsService;
    usersService;
    constructor(repository, applicationsService, usersService) {
        this.repository = repository;
        this.applicationsService = applicationsService;
        this.usersService = usersService;
    }
    findAll() {
        return this.repository.find();
    }
    findOne(id) {
        const review = this.repository.findById(id);
        if (!review) {
            throw new common_1.NotFoundException(`Review with ID ${id} not found`);
        }
        return review;
    }
    findByApplication(applicationId) {
        return this.repository.findByApplication(applicationId);
    }
    findByReviewer(reviewerId) {
        return this.repository.findByReviewer(reviewerId);
    }
    create(data) {
        this.applicationsService.findOne(data.application_id);
        this.usersService.findOne(data.reviewer_id);
        return this.repository.create({
            ...data,
            status: data.status || review_status_enum_1.ReviewStatus.PENDING,
            reviewed_at: new Date(),
        });
    }
    update(id, updateData) {
        const existing = this.findOne(id);
        if (existing.digital_signature) {
            throw new common_1.BadRequestException('Cannot modify a signed review');
        }
        const updated = this.repository.update(id, {
            ...updateData,
            reviewed_at: updateData.status && updateData.status !== existing.status ? new Date() : existing.reviewed_at,
        });
        if (!updated) {
            throw new common_1.NotFoundException(`Review with ID ${id} not found`);
        }
        return updated;
    }
    signReview(id, signature) {
        const existing = this.findOne(id);
        if (existing.digital_signature) {
            throw new common_1.BadRequestException('Review is already signed');
        }
        if (existing.status === review_status_enum_1.ReviewStatus.PENDING || existing.status === review_status_enum_1.ReviewStatus.CLARIFICATION_REQUESTED) {
            throw new common_1.BadRequestException('Review must be APPROVED or REJECTED before signing');
        }
        const updated = this.repository.update(id, {
            digital_signature: signature,
            signed_at: new Date(),
        });
        if (!updated) {
            throw new common_1.NotFoundException(`Review with ID ${id} not found`);
        }
        return updated;
    }
    remove(id) {
        const existing = this.findOne(id);
        if (existing.digital_signature) {
            throw new common_1.BadRequestException('Cannot delete a signed review');
        }
        this.repository.delete(id);
    }
};
exports.DepartmentReviewsService = DepartmentReviewsService;
exports.DepartmentReviewsService = DepartmentReviewsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [department_reviews_repository_1.DepartmentReviewsRepository,
        applications_service_1.ApplicationsService,
        users_service_1.UsersService])
], DepartmentReviewsService);
//# sourceMappingURL=department-reviews.service.js.map