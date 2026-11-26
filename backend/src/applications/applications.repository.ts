import { Injectable } from '@nestjs/common';
import { Application } from './application.interface';
import { ApplicationStatus } from '../common/enums/application-status.enum';
import { LicenseStatus } from '../common/enums/license-status.enum';
import { JsonStore } from '../common/persistence/json-store';

const activelyProcessedStatuses = new Set<string>([
  ApplicationStatus.SUBMITTED,
  ApplicationStatus.ASSIGNED,
  ApplicationStatus.VERIFIED,
  ApplicationStatus.DOCUMENTS_UPLOADED,
  ApplicationStatus.INSPECTION_SCHEDULED,
  ApplicationStatus.INSPECTION_COMPLETED,
  ApplicationStatus.DEPARTMENT_REVIEW,
]);

function normalizeBusinessName(value: unknown): string {
  return (typeof value === 'string' ? value : '').trim().replace(/\s+/g, ' ').toLowerCase();
}

function normalizeMunicipalityId(value: unknown): string {
  return (typeof value === 'string' ? value : '').trim().toLowerCase();
}

@Injectable()
export class ApplicationsRepository {
  constructor(private readonly store: JsonStore) {}

  find(): Application[] {
    return this.store.snapshot().applications;
  }

  findById(id: number): Application | undefined {
    return this.find().find((app) => app.application_id === id);
  }

  findByApplicant(applicantId: number): Application[] {
    return this.find().filter((app) => app.applicant_id === applicantId);
  }

  // Included basic CRUD methods for seamless service integration
  create(
    application: Omit<Application, 'application_id' | 'application_ref' | 'submitted_at'>,
  ): Application {
    const data = this.store.snapshot();
    return this.insert(data, application);
  }

  createUnlessDuplicate(
    application: Omit<Application, 'application_id' | 'application_ref' | 'submitted_at'>,
    now = new Date(),
  ): { application?: Application; duplicate?: Application } {
    const data = this.store.snapshot();
    const businessName = normalizeBusinessName(application.business_name);
    const municipalityId = normalizeMunicipalityId(application.municipality_id);

    if (businessName && businessName !== 'n/a' && municipalityId) {
      const duplicate = data.applications.find((existing) => {
        if (
          Number(existing.applicant_id) !== Number(application.applicant_id) ||
          normalizeBusinessName(existing.business_name) !== businessName ||
          normalizeMunicipalityId(existing.municipality_id) !== municipalityId
        ) {
          return false;
        }

        const status = String(existing.application_status || '').toLowerCase();
        if (activelyProcessedStatuses.has(status)) return true;
        if (status !== String(ApplicationStatus.APPROVED)) return false;

        const license = data.licenses.find(
          (item) => Number(item.application_id) === Number(existing.application_id),
        );
        const expiryTime = license ? new Date(license.expiry_date).getTime() : Number.NaN;
        return (
          String(license?.status || '').toUpperCase() === String(LicenseStatus.ACTIVE) &&
          Number.isFinite(expiryTime) &&
          expiryTime > now.getTime()
        );
      });

      if (duplicate) return { duplicate };
    }

    return { application: this.insert(data, application) };
  }

  private insert(
    data: ReturnType<JsonStore['snapshot']>,
    application: Omit<Application, 'application_id' | 'application_ref' | 'submitted_at'>,
  ): Application {
    const applicationId = data.counters.applications++;
    const newApplication: Application = {
      ...application,
      application_id: applicationId,
      application_ref: `TL-${new Date().getFullYear()}-${String(applicationId).padStart(6, '0')}`,
      submitted_at: new Date(),
    };
    data.applications.push(newApplication);
    this.store.save();
    return newApplication;
  }

  update(
    id: number,
    updateData: Partial<Application>,
  ): Application | undefined {
    const applications = this.find();
    const index = applications.findIndex(
      (app) => app.application_id === id,
    );
    if (index === -1) return undefined;

    const cleanedUpdates: Partial<Application> = {};
    for (const key of Object.keys(updateData) as (keyof Application)[]) {
      if (updateData[key] !== undefined) {
        (cleanedUpdates as any)[key] = updateData[key];
      }
    }

    applications[index] = { ...applications[index], ...cleanedUpdates };
    this.store.save();
    return applications[index];
  }

  findByStatus(status: ApplicationStatus): Application[] {
    return this.find().filter(
      (app) => app.application_status === status,
    );
  }

  findByOfficer(officerId: number): Application[] {
    return this.find().filter(
      (app) => Number(app.assignedOfficerId) === Number(officerId) ||
        Number(app.verification_officer_id) === Number(officerId),
    );
  }

  delete(id: number): boolean {
    const applications = this.find();
    const initialLength = applications.length;
    const remaining = applications.filter(
      (app) => app.application_id !== id,
    );
    if (remaining.length === initialLength) return false;
    applications.splice(0, applications.length, ...remaining);
    this.store.save();
    return true;
  }
}
