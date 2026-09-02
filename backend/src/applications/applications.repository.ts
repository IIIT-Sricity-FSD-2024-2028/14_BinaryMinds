import { Injectable } from '@nestjs/common';
import { Application } from './application.interface';
import { ApplicationStatus } from '../common/enums/application-status.enum';
import { JsonStore } from '../common/persistence/json-store';

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
      (app) => app.assignedOfficerId === officerId,
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
