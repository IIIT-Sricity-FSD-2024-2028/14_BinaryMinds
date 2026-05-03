import { Injectable } from '@nestjs/common';
import { Application } from './application.interface';

@Injectable()
export class ApplicationsRepository {
  // In-memory data storage for applications
  private applications: Application[] = [];
  private idCounter = 1;

  find(): Application[] {
    return this.applications;
  }

  findById(id: number): Application | undefined {
    return this.applications.find((app) => app.application_id === id);
  }

  findByApplicant(applicantId: number): Application[] {
    return this.applications.filter((app) => app.applicant_id === applicantId);
  }

  // Included basic CRUD methods for seamless service integration
  create(
    application: Omit<Application, 'application_id' | 'submitted_at'>,
  ): Application {
    const newApplication: Application = {
      ...application,
      application_id: this.idCounter++,
      submitted_at: new Date(),
    };
    this.applications.push(newApplication);
    return newApplication;
  }

  update(
    id: number,
    updateData: Partial<Application>,
  ): Application | undefined {
    const index = this.applications.findIndex(
      (app) => app.application_id === id,
    );
    if (index === -1) return undefined;

    this.applications[index] = { ...this.applications[index], ...updateData };
    return this.applications[index];
  }

  delete(id: number): boolean {
    const initialLength = this.applications.length;
    this.applications = this.applications.filter(
      (app) => app.application_id !== id,
    );
    return this.applications.length !== initialLength;
  }
}
