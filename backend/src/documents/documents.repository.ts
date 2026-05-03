import { Injectable } from '@nestjs/common';
import { Document } from './document.interface';
import { VerificationStatus } from '../common/enums/verification-status.enum';

@Injectable()
export class DocumentsRepository {
  private documents: Document[] = [];
  private idCounter = 1;

  find(): Document[] {
    return this.documents;
  }

  findById(id: number): Document | undefined {
    return this.documents.find((doc) => doc.document_id === id);
  }

  findByApplication(applicationId: number): Document[] {
    return this.documents.filter((doc) => doc.application_id === applicationId);
  }

  create(document: Omit<Document, 'document_id' | 'uploaded_at'>): Document {
    const newDocument: Document = {
      ...document,
      document_id: this.idCounter++,
      uploaded_at: new Date(),
    };
    // Default verification status just in case
    if (!newDocument.verification_status) {
      newDocument.verification_status = VerificationStatus.PENDING;
    }
    this.documents.push(newDocument);
    return newDocument;
  }

  update(id: number, updateData: Partial<Document>): Document | undefined {
    const index = this.documents.findIndex((doc) => doc.document_id === id);
    if (index === -1) return undefined;

    this.documents[index] = { ...this.documents[index], ...updateData };
    return this.documents[index];
  }

  delete(id: number): boolean {
    const initialLength = this.documents.length;
    this.documents = this.documents.filter((doc) => doc.document_id !== id);
    return this.documents.length !== initialLength;
  }
}
