import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InspectionsRepository } from './inspections.repository';
import { Inspection, InspectionEvidenceFile } from './inspection.interface';
import { CreateInspectionDto } from './dto/create-inspection.dto';
import { SubmitInspectionReportDto } from './dto/submit-inspection-report.dto';
import { InspectionStatus } from '../common/enums/inspection-status.enum';
import { FieldOfficerAssignmentsService } from '../field-officer-assignments/field-officer-assignments.service';

@Injectable()
export class InspectionsService {
  constructor(
    private readonly repository: InspectionsRepository,
    private readonly assignmentsService: FieldOfficerAssignmentsService,
  ) {}

  findAll(): Inspection[] {
    return this.repository.find();
  }

  findOne(id: number): Inspection {
    const inspection = this.repository.findById(id);
    if (!inspection) {
      throw new NotFoundException(`Inspection with ID ${id} not found`);
    }
    return inspection;
  }

  findByAssignment(assignmentId: number): Inspection[] {
    return this.repository.findByAssignment(assignmentId);
  }

  findByApplication(applicationId: number): Inspection[] {
    return this.assignmentsService.findByApplication(applicationId)
      .flatMap((assignment) => this.repository.findByAssignment(assignment.assignment_id));
  }

  findAssignment(assignmentId: number) {
    return this.assignmentsService.findOne(assignmentId);
  }

  findByFieldOfficer(fieldOfficerId: number): Inspection[] {
    return this.repository.findByFieldOfficer(fieldOfficerId);
  }

  create(data: CreateInspectionDto): Inspection {
    this.assignmentsService.findOne(data.assignment_id);

    return this.repository.create({
      ...data,
      status: data.status || InspectionStatus.PENDING,
    });
  }

  update(id: number, updateData: Partial<Inspection>): Inspection {
    this.findOne(id);

    const updated = this.repository.update(id, updateData);
    if (!updated) {
      throw new NotFoundException(`Inspection with ID ${id} not found`);
    }
    return updated;
  }

  submitReport(
    id: number,
    reportData: SubmitInspectionReportDto,
    evidenceFiles: InspectionEvidenceFile[] = [],
  ): Inspection {
    const existing = this.findOne(id);
    if (existing.status === InspectionStatus.COMPLETED) {
      throw new BadRequestException('Inspection is already completed');
    }
    if (
      reportData.status !== InspectionStatus.COMPLETED &&
      reportData.status !== InspectionStatus.FAILED
    ) {
      throw new BadRequestException('Report submission must result in COMPLETED or FAILED status');
    }

    const updated = this.repository.update(id, {
      notes: reportData.notes,
      report_url: reportData.report_url,
      status: reportData.status,
      completed_date: new Date(),
      evidence_files: [...(existing.evidence_files || []), ...evidenceFiles],
    });

    if (!updated) {
       throw new NotFoundException(`Inspection with ID ${id} not found`);
    }
    return updated;
  }

  remove(id: number): void {
    this.findOne(id);
    this.repository.delete(id);
  }
}
