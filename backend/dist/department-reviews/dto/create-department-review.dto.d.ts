import { ReviewStatus } from '../../common/enums/review-status.enum';
export declare class CreateDepartmentReviewDto {
    application_id: number;
    reviewer_id: number;
    status?: ReviewStatus;
    comments?: string;
}
