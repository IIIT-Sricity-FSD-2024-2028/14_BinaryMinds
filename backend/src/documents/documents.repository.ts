import { Injectable } from '@nestjs/common';
import { Document } from './document.interface';
import { VerificationStatus } from '../common/enums/verification-status.enum';
import { JsonStore } from '../common/persistence/json-store';

@Injectable()
export class DocumentsRepository {
  constructor(private readonly store: JsonStore) {}

  find(): Document[] {
    return this.store.snapshot().documents;
  }

  findById(id: number): Document | undefined {
    return this.find().find((doc) => doc.document_id === id);
  }

  findByApplication(applicationId: number): Document[] {
    return this.find().filter((doc) => doc.application_id === applicationId);
  }

  create(document: Omit<Document, 'document_id' | 'uploaded_at'>): Document {
    const data = this.store.snapshot();
    const newDocument: Document = {
      ...document,
      document_id: data.counters.documents++,
      uploaded_at: new Date(),
    };
    // Default verification status just in case
    if (!newDocument.verification_status) {
      newDocument.verification_status = VerificationStatus.PENDING;
    }
    data.documents.push(newDocument);
    this.store.save();
    return newDocument;
  }

  update(id: number, updateData: Partial<Document>): Document | undefined {
    const documents = this.find();
    const index = documents.findIndex((doc) => doc.document_id === id);
    if (index === -1) return undefined;

    documents[index] = { ...documents[index], ...updateData };
    this.store.save();
    return documents[index];
  }

  delete(id: number): boolean {
    const data = this.store.snapshot();
    const initialLength = data.documents.length;
    data.documents = data.documents.filter((doc) => doc.document_id !== id);
    if (data.documents.length === initialLength) return false;
    this.store.save();
    return true;
  }
}
