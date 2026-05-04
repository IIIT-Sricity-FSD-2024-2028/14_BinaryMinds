"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DepartmentReviewsRepository = void 0;
const common_1 = require("@nestjs/common");
const review_status_enum_1 = require("../common/enums/review-status.enum");
let DepartmentReviewsRepository = class DepartmentReviewsRepository {
    reviews = [];
    idCounter = 1;
    find() {
        return this.reviews;
    }
    findById(id) {
        return this.reviews.find((r) => r.review_id === id);
    }
    findByApplication(applicationId) {
        return this.reviews.filter((r) => r.application_id === applicationId);
    }
    findByReviewer(reviewerId) {
        return this.reviews.filter((r) => r.reviewer_id === reviewerId);
    }
    create(review) {
        const newReview = {
            ...review,
            review_id: this.idCounter++,
        };
        if (!newReview.status) {
            newReview.status = review_status_enum_1.ReviewStatus.PENDING;
        }
        this.reviews.push(newReview);
        return newReview;
    }
    update(id, updateData) {
        const index = this.reviews.findIndex((r) => r.review_id === id);
        if (index === -1)
            return undefined;
        this.reviews[index] = { ...this.reviews[index], ...updateData };
        return this.reviews[index];
    }
    delete(id) {
        const initialLength = this.reviews.length;
        this.reviews = this.reviews.filter((r) => r.review_id !== id);
        return this.reviews.length !== initialLength;
    }
};
exports.DepartmentReviewsRepository = DepartmentReviewsRepository;
exports.DepartmentReviewsRepository = DepartmentReviewsRepository = __decorate([
    (0, common_1.Injectable)()
], DepartmentReviewsRepository);
//# sourceMappingURL=department-reviews.repository.js.map