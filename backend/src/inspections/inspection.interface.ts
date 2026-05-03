import { InspectionStatus } from '../common/enums/inspection-status.enum';

export interface Inspection {
  inspection_id: number;
  assignment_id: number;
  field_officer_id: number;
  scheduled_date?: Date;
  completed_date?: Date;
  status: InspectionStatus;
  notes?: string;
  report_url?: string;
}
