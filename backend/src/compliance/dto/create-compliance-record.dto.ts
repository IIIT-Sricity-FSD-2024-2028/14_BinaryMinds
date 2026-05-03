import { IsNotEmpty, IsNumber, IsString, IsEnum, IsOptional } from 'class-validator';
import { ComplianceStatus } from '../../common/enums/compliance-status.enum';

export class CreateComplianceRecordDto {
  @IsNumber()
  @IsNotEmpty()
  license_id!: number;

  @IsNumber()
  @IsNotEmpty()
  field_officer_id!: number;

  @IsString()
  @IsNotEmpty()
  violation_type!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsEnum(ComplianceStatus)
  @IsOptional()
  status?: ComplianceStatus;
}
