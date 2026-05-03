import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DocumentVerificationsRepository } from './document-verifications.repository';
import { DocumentVerification } from './document-verification.interface';
import { DocumentVerificationStatus } from '../common/enums/document-verification-status.enum';
import { CreateDocumentVerificationDto } from './dto/create-document-verification.dto';

@Injectable()
export class DocumentVerificationsService {
  constructor(private readonly repository: DocumentVerificationsRepository) {}

  findAll(): DocumentVerification[] {
    return this.repository.find();
  }

  findOne(id: number): DocumentVerification {
    const verification = this.repository.findById(id);
    if (!verification) {
      throw new NotFoundException(`Verification with ID ${id} not found`);
    }
    return verification;
  }

  findByApplication(applicationId: number): DocumentVerification[] {
    return this.repository.findByApplication(applicationId);
  }

  findByFieldOfficer(fieldOfficerId: number): DocumentVerification[] {
    return this.repository.findByFieldOfficer(fieldOfficerId);
  }

  create(
    data: CreateDocumentVerificationDto,
  ): DocumentVerification {
    // Apply validation specific to rejection workflows
    this.validateStatusLogic(data.verification_status, data.rejection_reason);

    const createData = {
      ...data,
      verification_status: data.verification_status || DocumentVerificationStatus.PENDING,
    };
    return this.repository.create(createData);
  }

  update(
    id: number,
    updateData: Partial<DocumentVerification>,
  ): DocumentVerification {
    const existing = this.findOne(id);
    const newStatus =
      updateData.verification_status || existing.verification_status;
    const newReason =
      updateData.rejection_reason !== undefined
        ? updateData.rejection_reason
        : existing.rejection_reason;

    // Apply strict rejection reason logic mathematically
    this.validateStatusLogic(newStatus, newReason);

    const updated = this.repository.update(id, updateData);
    if (!updated) {
      throw new NotFoundException(`Validation error updating ID ${id}`);
    }
    return updated;
  }

  remove(id: number): void {
    this.findOne(id);
    this.repository.delete(id);
  }

  private validateStatusLogic(
    status?: DocumentVerificationStatus,
    rejectionReason?: string,
  ) {
    if (
      status === DocumentVerificationStatus.REJECTED_ON_VERIFICATION &&
      (!rejectionReason || rejectionReason.trim() === '')
    ) {
      throw new BadRequestException(
        'A rejection reason must be strongly provided when rejecting a verification',
      );
    }
  }
}
