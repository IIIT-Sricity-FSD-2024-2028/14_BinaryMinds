import { Injectable, NotFoundException } from '@nestjs/common';
import { DocumentsRepository } from './documents.repository';
import { ApplicationsService } from '../applications/applications.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { Document } from './document.interface';
import { VerificationStatus } from '../common/enums/verification-status.enum';

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

  create(createDocumentDto: CreateDocumentDto): Document {
    // Validate application exists before assigning document
    this.applicationsService.findOne(createDocumentDto.application_id);

    // Basic file path management logic: trim and ensure clean string mapping
    const sanitizedPath = createDocumentDto.file_path.trim();

    const newDoc = {
      ...createDocumentDto,
      file_path: sanitizedPath,
      verification_status: VerificationStatus.PENDING,
    };

    return this.documentsRepository.create(newDoc);
  }

  updateVerificationStatus(id: number, status: VerificationStatus): Document {
    this.findOne(id); // Validate existence
    const updated = this.documentsRepository.update(id, {
      verification_status: status,
    });
    if (!updated) {
      throw new NotFoundException(
        `Document with ID ${id} not found during update`,
      );
    }
    return updated;
  }

  remove(id: number): void {
    this.findOne(id); // validates existence before removal
    this.documentsRepository.delete(id);
  }
}
