import { DocumentType } from '../../common/enums/document-type.enum';
export declare class CreateDocumentDto {
    application_id: number;
    document_type: DocumentType;
    file_path: string;
}
