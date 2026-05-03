import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ApplicationsRepository } from './applications.repository';
import { Application } from './application.interface';
import { ApplicationStatus } from '../common/enums/application-status.enum';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UsersService } from '../users/users.service';

@Injectable()
export class ApplicationsService {
  constructor(
    private readonly applicationsRepository: ApplicationsRepository,
    private readonly usersService: UsersService,
  ) {}

  findAll(): Application[] {
    return this.applicationsRepository.find();
  }

  // Relationship query: fetching all applications along with applicant details
  findAllWithApplicantDetails() {
    const apps = this.findAll();
    return apps.map((app) => {
      const applicant = this.usersService.findOne(app.applicant_id);
      return {
        ...app,
        applicant,
      };
    });
  }

  findOne(id: number): Application {
    const application = this.applicationsRepository.findById(id);
    if (!application) {
      throw new NotFoundException(`Application with ID ${id} not found`);
    }
    return application;
  }

  // Relationship query: fetching an application along with applicant details
  findOneWithApplicantDetails(id: number) {
    const application = this.findOne(id);
    const applicant = this.usersService.findOne(application.applicant_id);
    return {
      ...application,
      applicant,
    };
  }

  findByApplicant(applicantId: number): Application[] {
    // Validate applicant exists first
    this.usersService.findOne(applicantId);
    return this.applicationsRepository.findByApplicant(applicantId);
  }

  create(applicationData: CreateApplicationDto): Application {
    // Validate applicant existence before creating association
    this.usersService.findOne(applicationData.applicant_id);

    // Default the status to submitted if not provided
    const newAppRecord = {
      ...applicationData,
      application_status: ApplicationStatus.SUBMITTED,
    };
    return this.applicationsRepository.create(newAppRecord);
  }

  update(id: number, updateData: Partial<Application>): Application {
    const existingApplication = this.findOne(id);

    // Business Logic: Status transition validation
    if (
      updateData.application_status &&
      updateData.application_status !== existingApplication.application_status
    ) {
      this.validateStatusTransition(
        existingApplication.application_status,
        updateData.application_status,
      );
    }

    const updatedApplication = this.applicationsRepository.update(
      id,
      updateData,
    );
    if (!updatedApplication) {
      throw new NotFoundException(
        `Application with ID ${id} not found during update`,
      );
    }

    return updatedApplication;
  }

  remove(id: number): void {
    this.findOne(id); // validates existence before removal
    this.applicationsRepository.delete(id);
  }

  private validateStatusTransition(
    currentStatus: ApplicationStatus,
    newStatus: ApplicationStatus,
  ): void {
    const allowedTransitions: Record<ApplicationStatus, ApplicationStatus[]> = {
      [ApplicationStatus.SUBMITTED]: [
        ApplicationStatus.DOCUMENTS_UPLOADED,
        ApplicationStatus.REJECTED,
      ],
      [ApplicationStatus.DOCUMENTS_UPLOADED]: [
        ApplicationStatus.INSPECTION_SCHEDULED,
        ApplicationStatus.REJECTED,
      ],
      [ApplicationStatus.INSPECTION_SCHEDULED]: [
        ApplicationStatus.INSPECTION_COMPLETED,
        ApplicationStatus.REJECTED,
      ],
      [ApplicationStatus.INSPECTION_COMPLETED]: [
        ApplicationStatus.DEPARTMENT_REVIEW,
        ApplicationStatus.REJECTED,
      ],
      [ApplicationStatus.DEPARTMENT_REVIEW]: [
        ApplicationStatus.APPROVED,
        ApplicationStatus.REJECTED,
      ],
      [ApplicationStatus.APPROVED]: [], // End state
      [ApplicationStatus.REJECTED]: [], // End state
    };

    const validNextStates = allowedTransitions[currentStatus] || [];

    if (!validNextStates.includes(newStatus)) {
      throw new BadRequestException(
        `Invalid status transition from ${currentStatus} to ${newStatus}`,
      );
    }
  }
}
