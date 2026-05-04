import { DocumentsRepository } from './documents.repository';
import { ApplicationsService } from '../applications/applications.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { Document } from './document.interface';
import { VerificationStatus } from '../common/enums/verification-status.enum';
export declare class DocumentsService {
    private readonly documentsRepository;
    private readonly applicationsService;
    constructor(documentsRepository: DocumentsRepository, applicationsService: ApplicationsService);
    findAll(): Document[];
    findOne(id: number): Document;
    findByApplication(applicationId: number): Document[];
    create(createDocumentDto: CreateDocumentDto): Document;
    updateVerificationStatus(id: number, status: VerificationStatus): Document;
    remove(id: number): void;
}
