import { LicenseStatus } from '../common/enums/license-status.enum';

export interface License {
  license_id: number;
  application_id: number;
  license_number: string;
  issued_date: Date;
  expiry_date: Date;
  status: LicenseStatus;
  issued_by: number;
}
