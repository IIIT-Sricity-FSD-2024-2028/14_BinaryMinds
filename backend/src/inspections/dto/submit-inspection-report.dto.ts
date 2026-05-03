import { IsNotEmpty, IsString, IsUrl, IsOptional, IsEnum } from 'class-validator';
import { InspectionStatus } from '../../common/enums/inspection-status.enum';

export class SubmitInspectionReportDto {
  @IsString()
  @IsNotEmpty()
  notes!: string;

  @IsUrl()
  @IsOptional()
  report_url?: string;

  @IsEnum(InspectionStatus)
  @IsNotEmpty()
  status!: InspectionStatus;
}
