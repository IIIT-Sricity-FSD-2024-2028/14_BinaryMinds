import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { FieldOfficerAssignmentsRepository } from './field-officer-assignments.repository';
import { Assignment } from './assignment.interface';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { AssignmentStatus } from '../common/enums/assignment-status.enum';
import { ApplicationsService } from '../applications/applications.service';
import { UsersService } from '../users/users.service';

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
    // Validate relations
    this.applicationsService.findOne(data.application_id);
    this.usersService.findOne(data.field_officer_id);
    this.usersService.findOne(data.assigned_by);

    // Add SLA deadline logic
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + this.SLA_DAYS);

    const createData = {
      ...data,
      status: data.status || AssignmentStatus.PENDING,
      deadline,
    };
    
    return this.repository.create(createData as any);
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
