import { Injectable } from '@nestjs/common';
import { DepartmentReview } from './review.interface';
import { ReviewStatus } from '../common/enums/review-status.enum';
import { JsonStore } from '../common/persistence/json-store';

@Injectable()
export class DepartmentReviewsRepository {
  constructor(private readonly store: JsonStore) {}

  find(): DepartmentReview[] {
    return this.store.snapshot().reviews.map((review) => ({
      ...review,
      reviewed_at: review.reviewed_at ? new Date(review.reviewed_at) : undefined,
      signed_at: review.signed_at ? new Date(review.signed_at) : undefined,
    }));
  }

  findById(id: number): DepartmentReview | undefined {
    return this.find().find((r) => r.review_id === id);
  }

  findByApplication(applicationId: number): DepartmentReview[] {
    return this.find().filter((r) => r.application_id === applicationId);
  }

  findByReviewer(reviewerId: number): DepartmentReview[] {
    return this.find().filter((r) => r.reviewer_id === reviewerId);
  }

  create(review: Omit<DepartmentReview, 'review_id'>): DepartmentReview {
    const data = this.store.snapshot();
    const newReview: DepartmentReview = {
      ...review,
      review_id: data.counters.reviews++,
    };
    if (!newReview.status) {
      newReview.status = ReviewStatus.PENDING;
    }
    data.reviews.push(newReview);
    this.store.save();
    return newReview;
  }

  update(id: number, updateData: Partial<DepartmentReview>): DepartmentReview | undefined {
    const data = this.store.snapshot();
    const index = data.reviews.findIndex((r) => r.review_id === id);
    if (index === -1) return undefined;

    data.reviews[index] = { ...data.reviews[index], ...updateData };
    this.store.save();
    return data.reviews[index];
  }

  delete(id: number): boolean {
    const data = this.store.snapshot();
    const initialLength = data.reviews.length;
    data.reviews = data.reviews.filter((r) => r.review_id !== id);
    if (data.reviews.length === initialLength) return false;
    this.store.save();
    return true;
  }
}
