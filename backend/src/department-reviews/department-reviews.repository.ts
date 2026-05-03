import { Injectable } from '@nestjs/common';
import { DepartmentReview } from './review.interface';
import { ReviewStatus } from '../common/enums/review-status.enum';

@Injectable()
export class DepartmentReviewsRepository {
  private reviews: DepartmentReview[] = [];
  private idCounter = 1;

  find(): DepartmentReview[] {
    return this.reviews;
  }

  findById(id: number): DepartmentReview | undefined {
    return this.reviews.find((r) => r.review_id === id);
  }

  findByApplication(applicationId: number): DepartmentReview[] {
    return this.reviews.filter((r) => r.application_id === applicationId);
  }

  findByReviewer(reviewerId: number): DepartmentReview[] {
    return this.reviews.filter((r) => r.reviewer_id === reviewerId);
  }

  create(review: Omit<DepartmentReview, 'review_id'>): DepartmentReview {
    const newReview: DepartmentReview = {
      ...review,
      review_id: this.idCounter++,
    };
    if (!newReview.status) {
      newReview.status = ReviewStatus.PENDING;
    }
    this.reviews.push(newReview);
    return newReview;
  }

  update(id: number, updateData: Partial<DepartmentReview>): DepartmentReview | undefined {
    const index = this.reviews.findIndex((r) => r.review_id === id);
    if (index === -1) return undefined;

    this.reviews[index] = { ...this.reviews[index], ...updateData };
    return this.reviews[index];
  }

  delete(id: number): boolean {
    const initialLength = this.reviews.length;
    this.reviews = this.reviews.filter((r) => r.review_id !== id);
    return this.reviews.length !== initialLength;
  }
}
