import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { ApplicationsRepository } from './applications.repository';
import { Application } from './application.interface';
import { ApplicationStatus } from '../common/enums/application-status.enum';
import { CreateApplicationDto } from './dto/create-application.dto';
import { CreateSimpleApplicationDto } from './dto/create-simple-application.dto';
import { UsersService } from '../users/users.service';
import { OfficersService } from '../officers/officers.service';

@Injectable()
export class ApplicationsService {
  constructor(
    private readonly applicationsRepository: ApplicationsRepository,
    private readonly usersService: UsersService,
    @Inject(forwardRef(() => OfficersService))
    private readonly officersService: OfficersService,
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
      paymentDone: true,
      assignedOfficerId: null,
    };
    return this.applicationsRepository.create(newAppRecord);
  }

  /**
   * Simplified create — used by the new workflow.
   * Only requires applicantName. Payment is recorded separately, status starts submitted.
   */
  createSimple(data: CreateSimpleApplicationDto, applicantId: number): Application {
    this.usersService.findOne(applicantId);
    const newAppRecord = {
      applicant_id: applicantId,
      full_name: data.applicantName,
      business_name: data.businessName || 'N/A',
      business_type: data.tradeCategory || 'General',
      trade_category: data.tradeCategory || 'General',
      shop_address: data.shopAddress || '',
      applicant_phone: data.phone || '',
      application_status: ApplicationStatus.SUBMITTED,
      paymentDone: false,
      assignedOfficerId: null,
    };
    return this.applicationsRepository.create(newAppRecord);
  }

  /**
   * Return all applications where status = 'submitted' AND paymentDone = true.
   */
  findSubmitted(): Application[] {
    return this.applicationsRepository
      .findByStatus(ApplicationStatus.SUBMITTED)
      .filter((app) => app.paymentDone === true);
  }

  /**
   * Assign an application to a specific officer, or to the officer with the least assignedCount.
   * Updates assignedOfficerId and status = 'assigned'.
   */
  assignToOfficer(id: number, officerId?: number): Application {
    const application = this.findOne(id);

    if (application.application_status !== ApplicationStatus.SUBMITTED) {
      throw new BadRequestException(
        `Application ${id} is not in 'submitted' status (current: ${application.application_status})`,
      );
    }

    const assignedId = officerId !== undefined ? officerId : this.officersService.findLeastLoaded().id;

    const updated = this.applicationsRepository.update(id, {
      assignedOfficerId: assignedId,
      application_status: ApplicationStatus.ASSIGNED,
    });

    if (!updated) {
      throw new NotFoundException(`Application with ID ${id} not found during assignment`);
    }

    return updated;
  }

  /**
   * Return all applications assigned to a specific officer.
   */
  findByOfficer(officerId: number): Application[] {
    return this.applicationsRepository.findByOfficer(officerId);
  }

  /**
   * Mark an application as verified (officer action).
   */
  verify(id: number): Application {
    const application = this.findOne(id);

    if (application.application_status !== ApplicationStatus.ASSIGNED) {
      throw new BadRequestException(
        `Application ${id} is not in 'assigned' status (current: ${application.application_status})`,
      );
    }

    const updated = this.applicationsRepository.update(id, {
      application_status: ApplicationStatus.VERIFIED,
    });

    if (!updated) {
      throw new NotFoundException(`Application with ID ${id} not found during verification`);
    }

    return updated;
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
        ApplicationStatus.ASSIGNED,
        ApplicationStatus.VERIFIED,
        ApplicationStatus.DOCUMENTS_UPLOADED,
        ApplicationStatus.APPROVED,
        ApplicationStatus.REJECTED,
      ],
      [ApplicationStatus.ASSIGNED]: [
        ApplicationStatus.VERIFIED,
        ApplicationStatus.REJECTED,
      ],
      [ApplicationStatus.VERIFIED]: [
        ApplicationStatus.DOCUMENTS_UPLOADED,
        ApplicationStatus.INSPECTION_SCHEDULED,
        ApplicationStatus.APPROVED,
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
