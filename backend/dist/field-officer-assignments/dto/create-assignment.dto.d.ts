import { AssignmentStatus } from '../../common/enums/assignment-status.enum';
export declare class CreateAssignmentDto {
    application_id: number;
    field_officer_id: number;
    assigned_by: number;
    status?: AssignmentStatus;
    remarks?: string;
}
