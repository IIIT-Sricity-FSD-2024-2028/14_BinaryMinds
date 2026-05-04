import { ComplianceRepository } from './compliance.repository';
import { ComplianceRecord } from './compliance-record.interface';
import { CreateComplianceRecordDto } from './dto/create-compliance-record.dto';
import { LicensesService } from '../licenses/licenses.service';
import { UsersService } from '../users/users.service';
export declare class ComplianceService {
    private readonly repository;
    private readonly licensesService;
    private readonly usersService;
    constructor(repository: ComplianceRepository, licensesService: LicensesService, usersService: UsersService);
    findAll(): ComplianceRecord[];
    findOne(id: number): ComplianceRecord;
    findByLicense(licenseId: number): ComplianceRecord[];
    findByFieldOfficer(fieldOfficerId: number): ComplianceRecord[];
    create(data: CreateComplianceRecordDto): ComplianceRecord;
    update(id: number, updateData: Partial<ComplianceRecord>): ComplianceRecord;
    resolveWarning(id: number): ComplianceRecord;
    escalateWarning(id: number): ComplianceRecord;
    remove(id: number): void;
}
