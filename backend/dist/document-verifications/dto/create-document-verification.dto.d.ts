import { DocumentVerificationStatus } from '../../common/enums/document-verification-status.enum';
export declare class CreateDocumentVerificationDto {
    application_id: number;
    field_officer_id: number;
    verification_status?: DocumentVerificationStatus;
    rejection_reason?: string;
}
