import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DocumentsRepository } from './documents.repository';
import { ApplicationsService } from '../applications/applications.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { Document } from './document.interface';
import { VerificationStatus } from '../common/enums/verification-status.enum';
import { removeStoredUpload, resolveStoredDocumentPath } from './document-storage';

@Injectable()
export class DocumentsService {
  constructor(
    private readonly documentsRepository: DocumentsRepository,
    private readonly applicationsService: ApplicationsService,
  ) {}

  findAll(): Document[] {
    return this.documentsRepository.find();
  }

  findOne(id: number): Document {
    const document = this.documentsRepository.findById(id);
    if (!document) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }
    return document;
  }

  findByApplication(applicationId: number): Document[] {
    // Validate if associated application actually exists
    this.applicationsService.findOne(applicationId);
    return this.documentsRepository.findByApplication(applicationId);
  }

  create(
    createDocumentDto: CreateDocumentDto,
    filePath: string,
    originalFilename: string,
    mimeType: string,
  ): Document {
    // Validate application exists before assigning document
    this.applicationsService.findOne(createDocumentDto.application_id);

    const newDoc = {
      ...createDocumentDto,
      file_path: filePath,
      original_filename: originalFilename,
      mime_type: mimeType,
      verification_status: VerificationStatus.PENDING,
    };

    return this.documentsRepository.create(newDoc);
  }

  updateVerificationStatus(id: number, status: VerificationStatus, rejectionReason?: string): Document {
    const existing = this.findOne(id);
    if (status === VerificationStatus.REJECTED && !rejectionReason?.trim()) {
      throw new BadRequestException('A rejection reason is required when rejecting a document');
    }
    if (status !== VerificationStatus.PENDING &&
        status !== VerificationStatus.VERIFIED &&
        status !== VerificationStatus.REJECTED) {
      throw new BadRequestException('Invalid document verification status');
    }
    const reason = rejectionReason?.trim();
    const updated = this.documentsRepository.update(id, {
      verification_status: status,
      rejection_reason: status === VerificationStatus.REJECTED
        ? reason
        : undefined,
    });
    if (!updated) {
      throw new NotFoundException(
        `Document with ID ${id} not found during update`,
      );
    }
    return { ...existing, ...updated };
  }

  remove(id: number): void {
    const document = this.findOne(id);
    const storedFile = resolveStoredDocumentPath(document.file_path);
    removeStoredUpload(storedFile);
    this.documentsRepository.delete(id);
  }
}
