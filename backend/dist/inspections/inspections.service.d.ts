import { InspectionsRepository } from './inspections.repository';
import { Inspection } from './inspection.interface';
import { CreateInspectionDto } from './dto/create-inspection.dto';
import { SubmitInspectionReportDto } from './dto/submit-inspection-report.dto';
import { FieldOfficerAssignmentsService } from '../field-officer-assignments/field-officer-assignments.service';
export declare class InspectionsService {
    private readonly repository;
    private readonly assignmentsService;
    constructor(repository: InspectionsRepository, assignmentsService: FieldOfficerAssignmentsService);
    findAll(): Inspection[];
    findOne(id: number): Inspection;
    findByAssignment(assignmentId: number): Inspection[];
    findByFieldOfficer(fieldOfficerId: number): Inspection[];
    create(data: CreateInspectionDto): Inspection;
    update(id: number, updateData: Partial<Inspection>): Inspection;
    submitReport(id: number, reportData: SubmitInspectionReportDto): Inspection;
    remove(id: number): void;
}
