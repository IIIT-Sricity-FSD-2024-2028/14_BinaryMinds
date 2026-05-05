import { Application } from './application.interface';
import { ApplicationStatus } from '../common/enums/application-status.enum';
export declare class ApplicationsRepository {
    private applications;
    private idCounter;
    find(): Application[];
    findById(id: number): Application | undefined;
    findByApplicant(applicantId: number): Application[];
    create(application: Omit<Application, 'application_id' | 'submitted_at'>): Application;
    update(id: number, updateData: Partial<Application>): Application | undefined;
    findByStatus(status: ApplicationStatus): Application[];
    findByOfficer(officerId: number): Application[];
    delete(id: number): boolean;
}
