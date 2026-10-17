import { Injectable } from '@nestjs/common';
import { Inspection } from './inspection.interface';
import { InspectionStatus } from '../common/enums/inspection-status.enum';
import { JsonStore } from '../common/persistence/json-store';

@Injectable()
export class InspectionsRepository {
  constructor(private readonly store: JsonStore) {}

  find(): Inspection[] {
    return this.store.snapshot().inspections.map((inspection) => ({
      ...inspection,
      scheduled_date: inspection.scheduled_date ? new Date(inspection.scheduled_date) : undefined,
      completed_date: inspection.completed_date ? new Date(inspection.completed_date) : undefined,
    }));
  }

  findById(id: number): Inspection | undefined {
    return this.find().find((i) => i.inspection_id === id);
  }

  findByAssignment(assignmentId: number): Inspection[] {
    return this.find().filter((i) => i.assignment_id === assignmentId);
  }

  findByFieldOfficer(fieldOfficerId: number): Inspection[] {
    return this.find().filter((i) => i.field_officer_id === fieldOfficerId);
  }

  create(inspection: Omit<Inspection, 'inspection_id'>): Inspection {
    const data = this.store.snapshot();
    const newInspection: Inspection = {
      ...inspection,
      inspection_id: data.counters.inspections++,
    };
    if (!newInspection.status) {
      newInspection.status = InspectionStatus.PENDING;
    }
    data.inspections.push(newInspection);
    this.store.save();
    return newInspection;
  }

  update(id: number, updateData: Partial<Inspection>): Inspection | undefined {
    const data = this.store.snapshot();
    const index = data.inspections.findIndex((i) => i.inspection_id === id);
    if (index === -1) return undefined;

    data.inspections[index] = { ...data.inspections[index], ...updateData };
    this.store.save();
    return data.inspections[index];
  }

  delete(id: number): boolean {
    const data = this.store.snapshot();
    const initialLength = data.inspections.length;
    data.inspections = data.inspections.filter((i) => i.inspection_id !== id);
    if (data.inspections.length === initialLength) return false;
    this.store.save();
    return true;
  }
}
