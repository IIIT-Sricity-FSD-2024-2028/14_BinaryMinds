import { InspectionsService } from './inspections.service';
import { CreateInspectionDto } from './dto/create-inspection.dto';
import { UpdateInspectionDto } from './dto/update-inspection.dto';
import { SubmitInspectionReportDto } from './dto/submit-inspection-report.dto';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
export declare class InspectionsController {
    private readonly service;
    private readonly auditLogsService;
    constructor(service: InspectionsService, auditLogsService: AuditLogsService);
    create(createDto: CreateInspectionDto): import("./inspection.interface").Inspection;
    findAll(): import("./inspection.interface").Inspection[];
    findByAssignment(assignmentId: number): import("./inspection.interface").Inspection[];
    findByFieldOfficer(fieldOfficerId: number): import("./inspection.interface").Inspection[];
    findOne(id: number): import("./inspection.interface").Inspection;
    update(id: number, updateDto: UpdateInspectionDto): import("./inspection.interface").Inspection;
    submitReport(id: number, reportDto: SubmitInspectionReportDto): import("./inspection.interface").Inspection;
    remove(id: number): void;
}
