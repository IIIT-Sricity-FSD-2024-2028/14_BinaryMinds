import { DocumentType } from '../common/enums/document-type.enum';
import { VerificationStatus } from '../common/enums/verification-status.enum';
export interface Document {
    document_id: number;
    application_id: number;
    document_type: DocumentType;
    file_path: string;
    verification_status: VerificationStatus;
    uploaded_at?: Date;
}
