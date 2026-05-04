import { ComplianceStatus } from '../../common/enums/compliance-status.enum';
export declare class CreateComplianceRecordDto {
    license_id: number;
    field_officer_id: number;
    violation_type: string;
    description: string;
    status?: ComplianceStatus;
}
