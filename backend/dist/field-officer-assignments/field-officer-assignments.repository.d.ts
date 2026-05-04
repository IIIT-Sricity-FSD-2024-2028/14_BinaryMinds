import { Assignment } from './assignment.interface';
export declare class FieldOfficerAssignmentsRepository {
    private assignments;
    private idCounter;
    find(): Assignment[];
    findById(id: number): Assignment | undefined;
    findByApplication(applicationId: number): Assignment[];
    findByFieldOfficer(fieldOfficerId: number): Assignment[];
    create(assignment: Omit<Assignment, 'assignment_id' | 'assigned_at'>): Assignment;
    update(id: number, updateData: Partial<Assignment>): Assignment | undefined;
    delete(id: number): boolean;
}
