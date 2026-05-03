import { PartialType } from '@nestjs/swagger';
import { CreateDepartmentReviewDto } from './create-department-review.dto';

export class UpdateDepartmentReviewDto extends PartialType(CreateDepartmentReviewDto) {}
