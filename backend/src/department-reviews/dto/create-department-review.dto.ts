import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { ReviewStatus } from '../../common/enums/review-status.enum';

export class CreateDepartmentReviewDto {
  @IsNumber()
  @IsNotEmpty()
  application_id!: number;

  @IsNumber()
  @IsNotEmpty()
  reviewer_id!: number;

  @IsEnum(ReviewStatus)
  @IsOptional()
  status?: ReviewStatus;

  @IsString()
  @IsOptional()
  comments?: string;
}
