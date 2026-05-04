import { DepartmentReview } from './review.interface';
export declare class DepartmentReviewsRepository {
    private reviews;
    private idCounter;
    find(): DepartmentReview[];
    findById(id: number): DepartmentReview | undefined;
    findByApplication(applicationId: number): DepartmentReview[];
    findByReviewer(reviewerId: number): DepartmentReview[];
    create(review: Omit<DepartmentReview, 'review_id'>): DepartmentReview;
    update(id: number, updateData: Partial<DepartmentReview>): DepartmentReview | undefined;
    delete(id: number): boolean;
}
