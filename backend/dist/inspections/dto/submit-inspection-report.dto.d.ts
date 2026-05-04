import { InspectionStatus } from '../../common/enums/inspection-status.enum';
export declare class SubmitInspectionReportDto {
    notes: string;
    report_url?: string;
    status: InspectionStatus;
}
