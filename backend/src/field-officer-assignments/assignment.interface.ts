import { AssignmentStatus } from '../common/enums/assignment-status.enum';

export interface Assignment {
  assignment_id: number;
  application_id: number;
  field_officer_id: number;
  assigned_by?: number;
  assigned_at?: Date;
  status: AssignmentStatus;
  inspection_date?: Date;
  deadline?: Date;
  remarks?: string;
  recovered_from_application_assignment?: boolean;
  recovered_at?: Date;
}
