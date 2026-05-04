import { ComplianceRecord } from './compliance-record.interface';
export declare class ComplianceRepository {
    private records;
    private idCounter;
    find(): ComplianceRecord[];
    findById(id: number): ComplianceRecord | undefined;
    findByLicense(licenseId: number): ComplianceRecord[];
    findByFieldOfficer(fieldOfficerId: number): ComplianceRecord[];
    create(record: Omit<ComplianceRecord, 'record_id' | 'issued_at'>): ComplianceRecord;
    update(id: number, updateData: Partial<ComplianceRecord>): ComplianceRecord | undefined;
    delete(id: number): boolean;
}
