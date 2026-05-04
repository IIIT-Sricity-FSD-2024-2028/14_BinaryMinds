import { ReviewStatus } from '../common/enums/review-status.enum';
export interface DepartmentReview {
    review_id: number;
    application_id: number;
    reviewer_id: number;
    status: ReviewStatus;
    comments?: string;
    reviewed_at?: Date;
    digital_signature?: string;
    signed_at?: Date;
}
