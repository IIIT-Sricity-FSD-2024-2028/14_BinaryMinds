import { Document } from './document.interface';
export declare class DocumentsRepository {
    private documents;
    private idCounter;
    find(): Document[];
    findById(id: number): Document | undefined;
    findByApplication(applicationId: number): Document[];
    create(document: Omit<Document, 'document_id' | 'uploaded_at'>): Document;
    update(id: number, updateData: Partial<Document>): Document | undefined;
    delete(id: number): boolean;
}
