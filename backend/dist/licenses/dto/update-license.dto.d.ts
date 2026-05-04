import { CreateLicenseDto } from './create-license.dto';
import { LicenseStatus } from '../../common/enums/license-status.enum';
declare const UpdateLicenseDto_base: import("@nestjs/common").Type<Partial<CreateLicenseDto>>;
export declare class UpdateLicenseDto extends UpdateLicenseDto_base {
    status?: LicenseStatus;
}
export {};
