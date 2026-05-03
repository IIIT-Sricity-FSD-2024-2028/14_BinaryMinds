import { DocumentVerificationStatus } from '../common/enums/document-verification-status.enum';

export interface DocumentVerification {
  verification_id: number;
  application_id: number;
  field_officer_id: number;
  verification_status: DocumentVerificationStatus;
  rejection_reason?: string;
  verified_at?: Date;
}
