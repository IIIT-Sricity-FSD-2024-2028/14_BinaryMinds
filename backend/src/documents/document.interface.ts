import { DocumentType } from '../common/enums/document-type.enum';
import { VerificationStatus } from '../common/enums/verification-status.enum';

export interface Document {
  document_id: number;
  application_id: number;
  document_type: DocumentType;
  file_path: string;
  original_filename?: string;
  mime_type?: string;
  verification_status: VerificationStatus;
  rejection_reason?: string;
  uploaded_at?: Date;
}
