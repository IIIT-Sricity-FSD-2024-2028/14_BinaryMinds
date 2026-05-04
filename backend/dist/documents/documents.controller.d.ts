import { DocumentsService } from './documents.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { VerificationStatus } from '../common/enums/verification-status.enum';
export declare class DocumentsController {
    private readonly documentsService;
    constructor(documentsService: DocumentsService);
    create(createDocumentDto: CreateDocumentDto): import("./document.interface").Document;
    findAll(): import("./document.interface").Document[];
    findByApplication(applicationId: number): import("./document.interface").Document[];
    findOne(id: number): import("./document.interface").Document;
    updateStatus(id: number, status: VerificationStatus): import("./document.interface").Document;
    remove(id: number): void;
}
