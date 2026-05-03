import { PartialType } from '@nestjs/swagger';
import { CreateLicenseDto } from './create-license.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { LicenseStatus } from '../../common/enums/license-status.enum';

export class UpdateLicenseDto extends PartialType(CreateLicenseDto) {
  @IsEnum(LicenseStatus)
  @IsOptional()
  status?: LicenseStatus;
}
