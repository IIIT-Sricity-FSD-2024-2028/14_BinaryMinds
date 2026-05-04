import { InspectionStatus } from '../../common/enums/inspection-status.enum';
export declare class CreateInspectionDto {
    assignment_id: number;
    field_officer_id: number;
    scheduled_date?: Date;
    status?: InspectionStatus;
    notes?: string;
}
