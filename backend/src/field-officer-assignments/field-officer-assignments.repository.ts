import { Injectable } from '@nestjs/common';
import { Assignment } from './assignment.interface';
import { AssignmentStatus } from '../common/enums/assignment-status.enum';
import { JsonStore } from '../common/persistence/json-store';

@Injectable()
export class FieldOfficerAssignmentsRepository {
  constructor(private readonly store: JsonStore) {}

  find(): Assignment[] {
    return this.store.snapshot().assignments.map((assignment) => ({
      ...assignment,
      assigned_at: assignment.assigned_at ? new Date(assignment.assigned_at) : undefined,
      deadline: assignment.deadline ? new Date(assignment.deadline) : undefined,
      recovered_at: assignment.recovered_at ? new Date(assignment.recovered_at) : undefined,
    }));
  }

  findById(id: number): Assignment | undefined {
    return this.find().find((a) => a.assignment_id === id);
  }

  findByApplication(applicationId: number): Assignment[] {
    return this.find().filter((a) => a.application_id === applicationId);
  }

  findByFieldOfficer(fieldOfficerId: number): Assignment[] {
    return this.find().filter((a) => a.field_officer_id === fieldOfficerId);
  }

  create(assignment: Omit<Assignment, 'assignment_id' | 'assigned_at'> & { assigned_at?: Date }): Assignment {
    const data = this.store.snapshot();
    const newAssignment: Assignment = {
      ...assignment,
      assignment_id: data.counters.assignments++,
    };
    if (!newAssignment.recovered_from_application_assignment && !newAssignment.assigned_at) {
      newAssignment.assigned_at = new Date();
    }
    if (!newAssignment.status) {
      newAssignment.status = AssignmentStatus.PENDING;
    }
    data.assignments.push(newAssignment);
    this.store.save();
    return newAssignment;
  }

  update(id: number, updateData: Partial<Assignment>): Assignment | undefined {
    const data = this.store.snapshot();
    const index = data.assignments.findIndex((a) => a.assignment_id === id);
    if (index === -1) return undefined;

    data.assignments[index] = { ...data.assignments[index], ...updateData };
    this.store.save();
    return data.assignments[index];
  }

  delete(id: number): boolean {
    const data = this.store.snapshot();
    const initialLength = data.assignments.length;
    data.assignments = data.assignments.filter((a) => a.assignment_id !== id);
    if (data.assignments.length === initialLength) return false;
    this.store.save();
    return true;
  }
}
