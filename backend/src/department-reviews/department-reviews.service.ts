import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DepartmentReviewsRepository } from './department-reviews.repository';
import { DepartmentReview } from './review.interface';
import { CreateDepartmentReviewDto } from './dto/create-department-review.dto';
import { ReviewStatus } from '../common/enums/review-status.enum';
import { ApplicationsService } from '../applications/applications.service';
import { UsersService } from '../users/users.service';
import { ApplicationStatus } from '../common/enums/application-status.enum';
import { Role } from '../common/enums/role.enum';

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

  decide(
    applicationId: number,
    reviewerId: number,
    status: ReviewStatus,
    comments: string,
  ): { review: DepartmentReview; application: ReturnType<ApplicationsService['findOne']> } {
    if (
      ![ReviewStatus.APPROVED, ReviewStatus.REJECTED, ReviewStatus.CLARIFICATION_REQUESTED].includes(status)
    ) {
      throw new BadRequestException('Choose an approval, rejection, or clarification decision');
    }
    if (!comments.trim()) {
      throw new BadRequestException('A formal justification is required');
    }
    const application = this.applicationsService.findOne(applicationId);
    const reviewer = this.usersService.findOne(reviewerId);
    if (reviewer.role !== Role.DEPARTMENT_OFFICER) {
      throw new BadRequestException('Only a Department Officer can decide this review');
    }
    if (
      ![
        ApplicationStatus.INSPECTION_SCHEDULED,
        ApplicationStatus.INSPECTION_COMPLETED,
        ApplicationStatus.DEPARTMENT_REVIEW,
      ].includes(application.application_status)
    ) {
      throw new BadRequestException(
        `Application ${applicationId} is not eligible for final review (current: ${application.application_status})`,
      );
    }

    let review = this.repository.findByApplication(applicationId)[0];
    if (review?.digital_signature) {
      throw new BadRequestException('Cannot modify a signed review');
    }

    if (application.application_status === ApplicationStatus.INSPECTION_SCHEDULED) {
      this.applicationsService.update(applicationId, {
        application_status: ApplicationStatus.INSPECTION_COMPLETED,
      });
    }
    if (
      application.application_status === ApplicationStatus.INSPECTION_SCHEDULED ||
      application.application_status === ApplicationStatus.INSPECTION_COMPLETED
    ) {
      this.applicationsService.update(applicationId, {
        application_status: ApplicationStatus.DEPARTMENT_REVIEW,
      });
    }

    const reviewedAt = new Date();
    if (review) {
      review = this.repository.update(review.review_id, {
        reviewer_id: reviewerId,
        status,
        comments: comments.trim(),
        reviewed_at: reviewedAt,
      })!;
    } else {
      review = this.repository.create({
        application_id: applicationId,
        reviewer_id: reviewerId,
        status,
        comments: comments.trim(),
        reviewed_at: reviewedAt,
      });
    }

    if (status === ReviewStatus.APPROVED || status === ReviewStatus.REJECTED) {
      const finalStatus = status === ReviewStatus.APPROVED
        ? ApplicationStatus.APPROVED
        : ApplicationStatus.REJECTED;
      this.applicationsService.update(applicationId, { application_status: finalStatus });
    }

    return { review, application: this.applicationsService.findOne(applicationId) };
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
