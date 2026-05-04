import { Inspection } from './inspection.interface';
export declare class InspectionsRepository {
    private inspections;
    private idCounter;
    find(): Inspection[];
    findById(id: number): Inspection | undefined;
    findByAssignment(assignmentId: number): Inspection[];
    findByFieldOfficer(fieldOfficerId: number): Inspection[];
    create(inspection: Omit<Inspection, 'inspection_id'>): Inspection;
    update(id: number, updateData: Partial<Inspection>): Inspection | undefined;
    delete(id: number): boolean;
}
