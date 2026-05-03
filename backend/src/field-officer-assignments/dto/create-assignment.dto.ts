import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { AssignmentStatus } from '../../common/enums/assignment-status.enum';

export class CreateAssignmentDto {
  @IsNumber()
  @IsNotEmpty()
  application_id!: number;

  @IsNumber()
  @IsNotEmpty()
  field_officer_id!: number;

  @IsNumber()
  @IsNotEmpty()
  assigned_by!: number;

  @IsEnum(AssignmentStatus)
  @IsOptional()
  status?: AssignmentStatus;

  @IsString()
  @IsOptional()
  remarks?: string;
}
