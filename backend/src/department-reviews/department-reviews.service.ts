import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DepartmentReviewsRepository } from './department-reviews.repository';
import { DepartmentReview } from './review.interface';
import { CreateDepartmentReviewDto } from './dto/create-department-review.dto';
import { ReviewStatus } from '../common/enums/review-status.enum';
import { ApplicationsService } from '../applications/applications.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class DepartmentReviewsService {
  constructor(
    private readonly repository: DepartmentReviewsRepository,
    private readonly applicationsService: ApplicationsService,
    private readonly usersService: UsersService,
  ) {}

  findAll(): DepartmentReview[] {
    return this.repository.find();
  }

  findOne(id: number): DepartmentReview {
    const review = this.repository.findById(id);
    if (!review) {
      throw new NotFoundException(`Review with ID ${id} not found`);
    }
    return review;
  }

  findByApplication(applicationId: number): DepartmentReview[] {
    return this.repository.findByApplication(applicationId);
  }

  findByReviewer(reviewerId: number): DepartmentReview[] {
    return this.repository.findByReviewer(reviewerId);
  }

  create(data: CreateDepartmentReviewDto): DepartmentReview {
    this.applicationsService.findOne(data.application_id);
    this.usersService.findOne(data.reviewer_id);

    return this.repository.create({
      ...data,
      status: data.status || ReviewStatus.PENDING,
      reviewed_at: new Date(),
    });
  }

  update(id: number, updateData: Partial<DepartmentReview>): DepartmentReview {
    const existing = this.findOne(id);
    if (existing.digital_signature) {
      throw new BadRequestException('Cannot modify a signed review');
    }

    const updated = this.repository.update(id, {
      ...updateData,
      reviewed_at: updateData.status && updateData.status !== existing.status ? new Date() : existing.reviewed_at,
    });
    
    if (!updated) {
      throw new NotFoundException(`Review with ID ${id} not found`);
    }
    return updated;
  }

  signReview(id: number, signature: string): DepartmentReview {
    const existing = this.findOne(id);
    if (existing.digital_signature) {
      throw new BadRequestException('Review is already signed');
    }

    if (existing.status === ReviewStatus.PENDING || existing.status === ReviewStatus.CLARIFICATION_REQUESTED) {
      throw new BadRequestException('Review must be APPROVED or REJECTED before signing');
    }

    const updated = this.repository.update(id, {
      digital_signature: signature,
      signed_at: new Date(),
    });

    if (!updated) {
       throw new NotFoundException(`Review with ID ${id} not found`);
    }

    return updated;
  }

  remove(id: number): void {
    const existing = this.findOne(id);
    if (existing.digital_signature) {
      throw new BadRequestException('Cannot delete a signed review');
    }
    this.repository.delete(id);
  }
}
