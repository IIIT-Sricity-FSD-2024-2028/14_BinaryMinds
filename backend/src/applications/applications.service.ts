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
import { MunicipalitiesService } from '../municipalities/municipalities.service';

@Injectable()
export class ApplicationsService {
  constructor(
    private readonly applicationsRepository: ApplicationsRepository,
    private readonly usersService: UsersService,
    private readonly municipalitiesService: MunicipalitiesService,
    @Inject(forwardRef(() => OfficersService))
    private readonly officersService: OfficersService,
  ) {}

  private enrichApplication(app: Application): Application {
    if (!app) return app;
    let email = (app as any).email || (app as any).applicant_email || (app as any).applicantEmail;
    if (!email && app.applicant_id) {
      try {
        const applicant = this.usersService.findOne(app.applicant_id);
        if (applicant && applicant.email) {
          email = applicant.email;
        }
      } catch (e) {}
    }
    return {
      ...app,
      email: email || '',
      applicant_email: email || '',
    };
  }

  findAll(municipalityId?: string): Application[] {
    const all = this.applicationsRepository.find();
    const filtered = !municipalityId
      ? all
      : all.filter(
          (app) => (app.municipality_id || '').toLowerCase() === municipalityId.toLowerCase(),
        );
    return filtered.map((app) => this.enrichApplication(app));
  }

  findByMunicipality(municipalityId: string): Application[] {
    return this.findAll(municipalityId);
  }

  // Relationship query: fetching all applications along with applicant details
  findAllWithApplicantDetails(municipalityId?: string) {
    const apps = this.findAll(municipalityId);
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
    return this.enrichApplication(application);
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
    const applicantId = applicationData.applicant_id || 1;
    // Validate applicant existence before creating association
    this.usersService.findOne(applicantId);

    // Resolve municipality server-side based on location / municipality_id
    const resolvedMuni = this.municipalitiesService.resolveMunicipality(
      applicationData.state,
      applicationData.city || applicationData.district,
      applicationData.municipality_id || applicationData.municipalityId,
    );

    const fullName =
      applicationData.full_name ||
      applicationData.applicantName ||
      'Applicant';

    const businessName =
      applicationData.business_name ||
      applicationData.businessName ||
      'N/A';

    const tradeCat =
      applicationData.trade_category ||
      applicationData.tradeCategory ||
      'General';

    const shopAddr =
      applicationData.shop_address ||
      applicationData.shopAddress ||
      '';

    const phone =
      applicationData.applicant_phone ||
      applicationData.phone ||
      '';

    // Default the status to submitted if not provided
    const newAppRecord = {
      ...applicationData,
      applicant_id: applicantId,
      full_name: fullName,
      business_name: businessName,
      trade_category: tradeCat,
      shop_address: shopAddr,
      applicant_phone: phone,
      municipality_id: resolvedMuni.municipality_id,
      municipalityName: resolvedMuni.name,
      application_status: ApplicationStatus.SUBMITTED,
      paymentDone: true,
      assignedOfficerId: null,
    };
    return this.applicationsRepository.create(newAppRecord);
  }

  /**
   * Simplified create — used by the applicant workflow.
   * Resolves target municipality server-side.
   */
  createSimple(data: CreateSimpleApplicationDto, applicantId: number): Application {
    this.usersService.findOne(applicantId);

    const resolvedMuni = this.municipalitiesService.resolveMunicipality(
      data.state,
      data.city || data.district,
      data.municipality_id || (data as any).municipalityId,
    );

    const newAppRecord = {
      applicant_id: applicantId,
      municipality_id: resolvedMuni.municipality_id,
      municipalityName: resolvedMuni.name,
      full_name: data.applicantName,
      business_name: data.businessName || 'N/A',
      business_type: data.businessType || data.tradeCategory || 'General',
      trade_category: data.tradeCategory || 'General',
      shop_address: data.shopAddress || '',
      city: data.city,
      district: data.district,
      state: data.state,
      pincode: data.pincode,
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
  findSubmitted(municipalityId?: string): Application[] {
    const list = this.applicationsRepository
      .findByStatus(ApplicationStatus.SUBMITTED)
      .filter((app) => app.paymentDone === true);
    if (!municipalityId) return list;
    return list.filter(
      (app) => (app.municipality_id || '').toLowerCase() === municipalityId.toLowerCase(),
    );
  }

  /**
   * Assign an application to a specific officer, or to the officer with the least assignedCount.
   * Updates assignedOfficerId and status = 'assigned'.
   */
  assignToOfficer(id: number, officerId?: number): Application {
    const application = this.findOne(id);

    if (
      application.application_status !== ApplicationStatus.SUBMITTED &&
      application.application_status !== ApplicationStatus.ASSIGNED
    ) {
      throw new BadRequestException(
        `Application ${id} is not in 'submitted' or 'assigned' status (current: ${application.application_status})`,
      );
    }

    let assignedId: number;
    if (officerId !== undefined) {
      const officer = this.usersService.findOne(officerId);
      if (
        (officer.municipality_id || '').toLowerCase() !==
        (application.municipality_id || '').toLowerCase()
      ) {
        throw new BadRequestException(
          'Cannot assign an officer from a different municipality to this application',
        );
      }
      assignedId = officerId;
    } else {
      const leastLoaded = this.officersService.findLeastLoaded(application.municipality_id);
      assignedId = leastLoaded.id;
    }

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
