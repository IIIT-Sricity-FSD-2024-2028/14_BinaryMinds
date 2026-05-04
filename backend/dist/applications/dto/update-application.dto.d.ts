import { CreateApplicationDto } from './create-application.dto';
import { ApplicationStatus } from '../../common/enums/application-status.enum';
declare const UpdateApplicationDto_base: import("@nestjs/common").Type<Partial<CreateApplicationDto>>;
export declare class UpdateApplicationDto extends UpdateApplicationDto_base {
    application_status?: ApplicationStatus;
}
export {};
