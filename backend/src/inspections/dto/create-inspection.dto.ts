import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsDateString } from 'class-validator';
import { InspectionStatus } from '../../common/enums/inspection-status.enum';

export class CreateInspectionDto {
  @IsNumber()
  @IsNotEmpty()
  assignment_id!: number;

  @IsNumber()
  @IsNotEmpty()
  field_officer_id!: number;

  @IsDateString()
  @IsOptional()
  scheduled_date?: Date;

  @IsEnum(InspectionStatus)
  @IsOptional()
  status?: InspectionStatus;

  @IsString()
  @IsOptional()
  notes?: string;
}
