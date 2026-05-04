import { ComplianceService } from './compliance.service';
import { CreateComplianceRecordDto } from './dto/create-compliance-record.dto';
import { UpdateComplianceRecordDto } from './dto/update-compliance-record.dto';
export declare class ComplianceController {
    private readonly service;
    constructor(service: ComplianceService);
    create(createDto: CreateComplianceRecordDto): import("./compliance-record.interface").ComplianceRecord;
    findAll(): import("./compliance-record.interface").ComplianceRecord[];
    findByLicense(licenseId: number): import("./compliance-record.interface").ComplianceRecord[];
    findByFieldOfficer(fieldOfficerId: number): import("./compliance-record.interface").ComplianceRecord[];
    findOne(id: number): import("./compliance-record.interface").ComplianceRecord;
    update(id: number, updateDto: UpdateComplianceRecordDto): import("./compliance-record.interface").ComplianceRecord;
    resolveWarning(id: number): import("./compliance-record.interface").ComplianceRecord;
    escalateWarning(id: number): import("./compliance-record.interface").ComplianceRecord;
    remove(id: number): void;
}
