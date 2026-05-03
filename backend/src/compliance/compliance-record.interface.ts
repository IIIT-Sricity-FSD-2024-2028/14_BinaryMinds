import { ComplianceStatus } from '../common/enums/compliance-status.enum';

export interface ComplianceRecord {
  record_id: number;
  license_id: number;
  field_officer_id: number;
  violation_type: string;
  description: string;
  status: ComplianceStatus;
  issued_at: Date;
  resolved_at?: Date;
}
