import { DocumentVerification } from './document-verification.interface';
export declare class DocumentVerificationsRepository {
    private verifications;
    private idCounter;
    find(): DocumentVerification[];
    findById(id: number): DocumentVerification | undefined;
    findByApplication(applicationId: number): DocumentVerification[];
    findByFieldOfficer(fieldOfficerId: number): DocumentVerification[];
    create(verification: Omit<DocumentVerification, 'verification_id' | 'verified_at'>): DocumentVerification;
    update(id: number, updateData: Partial<DocumentVerification>): DocumentVerification | undefined;
    delete(id: number): boolean;
}
