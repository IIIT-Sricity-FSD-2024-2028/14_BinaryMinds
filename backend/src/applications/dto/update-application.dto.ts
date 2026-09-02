import { PartialType } from '@nestjs/swagger';
import { CreateApplicationDto } from './create-application.dto';
import { ApplicationStatus } from '../../common/enums/application-status.enum';
import { IsBoolean, IsEnum, IsNumber, IsOptional } from 'class-validator';

export class UpdateApplicationDto extends PartialType(CreateApplicationDto) {
  @IsEnum(ApplicationStatus)
  @IsOptional()
  application_status?: ApplicationStatus;

  @IsBoolean()
  @IsOptional()
  paymentDone?: boolean;

  @IsNumber()
  @IsOptional()
  assignedOfficerId?: number;
}
