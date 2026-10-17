import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { FieldOfficerAssignmentsRepository } from './field-officer-assignments.repository';
import { Assignment } from './assignment.interface';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { AssignmentStatus } from '../common/enums/assignment-status.enum';
import { ApplicationsService } from '../applications/applications.service';
import { UsersService } from '../users/users.service';
import { Role } from '../common/enums/role.enum';
import { ApplicationStatus } from '../common/enums/application-status.enum';

@Injectable()
export class FieldOfficerAssignmentsService {
  private readonly SLA_DAYS = 7; // SLA limit in days

  constructor(
    private readonly repository: FieldOfficerAssignmentsRepository,
    private readonly applicationsService: ApplicationsService,
    private readonly usersService: UsersService,
  ) {}

  findAll(): Assignment[] {
    return this.repository.find();
  }

  findOne(id: number): Assignment {
    const assignment = this.repository.findById(id);
    if (!assignment) {
      throw new NotFoundException(`Assignment with ID ${id} not found`);
    }
    return assignment;
  }

  findByApplication(applicationId: number): Assignment[] {
    return this.repository.findByApplication(applicationId);
  }

  findByFieldOfficer(fieldOfficerId: number): Assignment[] {
    return this.repository.findByFieldOfficer(fieldOfficerId);
  }

  create(data: CreateAssignmentDto): Assignment {
    const app = this.applicationsService.findOne(data.application_id);
    const officer = this.usersService.findOne(data.field_officer_id);
    const assigner = this.usersService.findOne(data.assigned_by);

    if (officer.role !== Role.FIELD_OFFICER) {
      throw new BadRequestException('Assignments can only be assigned to a Field Officer');
    }
    if (
      app.assignedOfficerId === null ||
      app.assignedOfficerId === undefined ||
      Number(app.assignedOfficerId) !== Number(data.field_officer_id)
    ) {
      throw new BadRequestException('Assign the application to this Field Officer before creating its assignment');
    }
    if (
      (app.municipality_id || '').toLowerCase() !== (officer.municipality_id || '').toLowerCase()
    ) {
      throw new BadRequestException('Cannot assign an application to a field officer from a different municipality');
    }

    if (
      assigner.role !== Role.PLATFORM_ADMIN &&
      (assigner.municipality_id || '').toLowerCase() !== (app.municipality_id || '').toLowerCase()
    ) {
      throw new BadRequestException('Officer cannot assign applications outside their municipality');
    }

    const existing = this.repository.findByApplication(data.application_id)
      .filter((assignment) => Number(assignment.field_officer_id) === Number(data.field_officer_id));
    if (existing.length) return existing[existing.length - 1];

    const deadline = new Date();
    deadline.setDate(deadline.getDate() + this.SLA_DAYS);

    const createData = {
      ...data,
      status: data.status || AssignmentStatus.PENDING,
      deadline,
    };
    return this.repository.create(createData);
  }

  createForAssignedApplication(applicationId: number, fieldOfficerId: number, assignedBy: number): Assignment {
    const application = this.applicationsService.findOne(applicationId);
    if (Number(application.assignedOfficerId) !== Number(fieldOfficerId)) {
      throw new BadRequestException('Application assignment does not match the selected Field Officer');
    }
    return this.create({
      application_id: applicationId,
      field_officer_id: fieldOfficerId,
      assigned_by: assignedBy,
    });
  }

  recoverForFieldOfficer(applicationId: number, fieldOfficerId: number): Assignment {
    const application = this.applicationsService.findOne(applicationId);
    const officer = this.usersService.findOne(fieldOfficerId);
    if (
      Number(application.assignedOfficerId) !== Number(fieldOfficerId) ||
      officer.role !== Role.FIELD_OFFICER ||
      (application.municipality_id || '').toLowerCase() !== (officer.municipality_id || '').toLowerCase()
    ) {
      throw new BadRequestException('No matching saved Field Officer assignment can be recovered');
    }
    if (
      application.application_status !== ApplicationStatus.ASSIGNED &&
      application.application_status !== ApplicationStatus.VERIFIED &&
      application.application_status !== ApplicationStatus.DOCUMENTS_UPLOADED
    ) {
      throw new BadRequestException('This application is not at a stage where an assignment can be recovered');
    }

    const existing = this.repository.findByApplication(applicationId)
      .find((assignment) => Number(assignment.field_officer_id) === Number(fieldOfficerId));
    if (existing) return existing;

    return this.repository.create({
      application_id: applicationId,
      field_officer_id: fieldOfficerId,
      status: application.application_status === ApplicationStatus.ASSIGNED
        ? AssignmentStatus.PENDING
        : AssignmentStatus.IN_PROGRESS,
      recovered_from_application_assignment: true,
      recovered_at: new Date(),
      remarks: 'Recovered from the application record; original assignment details were not persisted.',
    });
  }

  update(id: number, updateData: Partial<Assignment>): Assignment {
    const existing = this.findOne(id);

    if (
      existing.status === AssignmentStatus.COMPLETED ||
      existing.status === AssignmentStatus.CANCELLED
    ) {
      if (updateData.status && updateData.status !== existing.status) {
        throw new BadRequestException('Cannot change status of a completed or cancelled assignment');
      }
    }

    const updated = this.repository.update(id, updateData);
    if (!updated) {
      throw new NotFoundException(`Assignment with ID ${id} not found`);
    }
    return updated;
  }

  checkSLA(id: number): { breached: boolean; daysRemaining: number } {
    const existing = this.findOne(id);
    if (!existing.deadline) {
      return { breached: false, daysRemaining: 0 };
    }
    const now = new Date();
    const diffTime = existing.deadline.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return {
      breached: diffDays < 0,
      daysRemaining: diffDays,
    };
  }

  remove(id: number): void {
    this.findOne(id);
    this.repository.delete(id);
  }
}
