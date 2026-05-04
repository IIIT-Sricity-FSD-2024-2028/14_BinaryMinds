import { ApplicationStatus } from '../common/enums/application-status.enum';
export interface Application {
    application_id: number;
    applicant_id: number;
    full_name: string;
    father_name?: string;
    date_of_birth?: Date | string;
    gender?: string;
    aadhaar_number?: string;
    applicant_phone?: string;
    business_name: string;
    business_type?: string;
    trade_category?: string;
    shop_address?: string;
    city?: string;
    district?: string;
    state?: string;
    pincode?: string;
    business_start_date?: Date | string;
    application_status: ApplicationStatus;
    submitted_at?: Date;
}
