import { Injectable } from '@nestjs/common';
import { DocumentVerification } from './document-verification.interface';
import { DocumentVerificationStatus } from '../common/enums/document-verification-status.enum';

@Injectable()
export class DocumentVerificationsRepository {
  private verifications: DocumentVerification[] = [];
  private idCounter = 1;

  find(): DocumentVerification[] {
    return this.verifications;
  }

  findById(id: number): DocumentVerification | undefined {
    return this.verifications.find((v) => v.verification_id === id);
  }

  findByApplication(applicationId: number): DocumentVerification[] {
    return this.verifications.filter((v) => v.application_id === applicationId);
  }

  findByFieldOfficer(fieldOfficerId: number): DocumentVerification[] {
    return this.verifications.filter((v) => v.field_officer_id === fieldOfficerId);
  }

  create(
    verification: Omit<DocumentVerification, 'verification_id' | 'verified_at'>,
  ): DocumentVerification {
    const newVerification: DocumentVerification = {
      ...verification,
      verification_id: this.idCounter++,
      verified_at: new Date(),
    };
    if (!newVerification.verification_status) {
      newVerification.verification_status = DocumentVerificationStatus.PENDING;
    }
    this.verifications.push(newVerification);
    return newVerification;
  }

  update(
    id: number,
    updateData: Partial<DocumentVerification>,
  ): DocumentVerification | undefined {
    const index = this.verifications.findIndex((v) => v.verification_id === id);
    if (index === -1) return undefined;

    this.verifications[index] = { ...this.verifications[index], ...updateData };
    return this.verifications[index];
  }

  delete(id: number): boolean {
    const initialLength = this.verifications.length;
    this.verifications = this.verifications.filter(
      (v) => v.verification_id !== id,
    );
    return this.verifications.length !== initialLength;
  }
}
