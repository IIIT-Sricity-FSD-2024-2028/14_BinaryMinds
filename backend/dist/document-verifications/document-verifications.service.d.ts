import { DocumentVerificationsRepository } from './document-verifications.repository';
import { DocumentVerification } from './document-verification.interface';
import { CreateDocumentVerificationDto } from './dto/create-document-verification.dto';
export declare class DocumentVerificationsService {
    private readonly repository;
    constructor(repository: DocumentVerificationsRepository);
    findAll(): DocumentVerification[];
    findOne(id: number): DocumentVerification;
    findByApplication(applicationId: number): DocumentVerification[];
    findByFieldOfficer(fieldOfficerId: number): DocumentVerification[];
    create(data: CreateDocumentVerificationDto): DocumentVerification;
    update(id: number, updateData: Partial<DocumentVerification>): DocumentVerification;
    remove(id: number): void;
    private validateStatusLogic;
}
