import { Injectable } from '@nestjs/common';
import { Assignment } from './assignment.interface';
import { AssignmentStatus } from '../common/enums/assignment-status.enum';

@Injectable()
export class FieldOfficerAssignmentsRepository {
  private assignments: Assignment[] = [];
  private idCounter = 1;

  find(): Assignment[] {
    return this.assignments;
  }

  findById(id: number): Assignment | undefined {
    return this.assignments.find((a) => a.assignment_id === id);
  }

  findByApplication(applicationId: number): Assignment[] {
    return this.assignments.filter((a) => a.application_id === applicationId);
  }

  findByFieldOfficer(fieldOfficerId: number): Assignment[] {
    return this.assignments.filter((a) => a.field_officer_id === fieldOfficerId);
  }

  create(assignment: Omit<Assignment, 'assignment_id' | 'assigned_at'>): Assignment {
    const newAssignment: Assignment = {
      ...assignment,
      assignment_id: this.idCounter++,
      assigned_at: new Date(),
    };
    if (!newAssignment.status) {
      newAssignment.status = AssignmentStatus.PENDING;
    }
    this.assignments.push(newAssignment);
    return newAssignment;
  }

  update(id: number, updateData: Partial<Assignment>): Assignment | undefined {
    const index = this.assignments.findIndex((a) => a.assignment_id === id);
    if (index === -1) return undefined;

    this.assignments[index] = { ...this.assignments[index], ...updateData };
    return this.assignments[index];
  }

  delete(id: number): boolean {
    const initialLength = this.assignments.length;
    this.assignments = this.assignments.filter((a) => a.assignment_id !== id);
    return this.assignments.length !== initialLength;
  }
}
