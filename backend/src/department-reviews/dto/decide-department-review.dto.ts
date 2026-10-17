import { IsEnum, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ReviewStatus } from '../../common/enums/review-status.enum';

export class DecideDepartmentReviewDto {
  @IsEnum(ReviewStatus)
  status!: ReviewStatus;

  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  comments!: string;
}
