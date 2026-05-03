import { Injectable } from '@nestjs/common';
import { Inspection } from './inspection.interface';
import { InspectionStatus } from '../common/enums/inspection-status.enum';

@Injectable()
export class InspectionsRepository {
  private inspections: Inspection[] = [];
  private idCounter = 1;

  find(): Inspection[] {
    return this.inspections;
  }

  findById(id: number): Inspection | undefined {
    return this.inspections.find((i) => i.inspection_id === id);
  }

  findByAssignment(assignmentId: number): Inspection[] {
    return this.inspections.filter((i) => i.assignment_id === assignmentId);
  }

  findByFieldOfficer(fieldOfficerId: number): Inspection[] {
    return this.inspections.filter((i) => i.field_officer_id === fieldOfficerId);
  }

  create(inspection: Omit<Inspection, 'inspection_id'>): Inspection {
    const newInspection: Inspection = {
      ...inspection,
      inspection_id: this.idCounter++,
    };
    if (!newInspection.status) {
      newInspection.status = InspectionStatus.PENDING;
    }
    this.inspections.push(newInspection);
    return newInspection;
  }

  update(id: number, updateData: Partial<Inspection>): Inspection | undefined {
    const index = this.inspections.findIndex((i) => i.inspection_id === id);
    if (index === -1) return undefined;

    this.inspections[index] = { ...this.inspections[index], ...updateData };
    return this.inspections[index];
  }

  delete(id: number): boolean {
    const initialLength = this.inspections.length;
    this.inspections = this.inspections.filter((i) => i.inspection_id !== id);
    return this.inspections.length !== initialLength;
  }
}
