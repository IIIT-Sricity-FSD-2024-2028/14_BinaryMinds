import { DocumentVerificationsService } from './document-verifications.service';
import { CreateDocumentVerificationDto } from './dto/create-document-verification.dto';
import { UpdateDocumentVerificationDto } from './dto/update-document-verification.dto';
export declare class DocumentVerificationsController {
    private readonly verificationsService;
    constructor(verificationsService: DocumentVerificationsService);
    create(createDto: CreateDocumentVerificationDto): import("./document-verification.interface").DocumentVerification;
    findAll(): import("./document-verification.interface").DocumentVerification[];
    findByApplication(applicationId: number): import("./document-verification.interface").DocumentVerification[];
    findByFieldOfficer(foId: number): import("./document-verification.interface").DocumentVerification[];
    findOne(id: number): import("./document-verification.interface").DocumentVerification;
    update(id: number, updateDto: UpdateDocumentVerificationDto): import("./document-verification.interface").DocumentVerification;
    remove(id: number): void;
}
