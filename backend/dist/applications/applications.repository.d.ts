import { Application } from './application.interface';
import { ApplicationStatus } from '../common/enums/application-status.enum';
import { JsonStore } from '../common/persistence/json-store';
export declare class ApplicationsRepository {
    private readonly store;
    constructor(store: JsonStore);
    find(): Application[];
    findById(id: number): Application | undefined;
    findByApplicant(applicantId: number): Application[];
    create(application: Omit<Application, 'application_id' | 'application_ref' | 'submitted_at'>): Application;
    update(id: number, updateData: Partial<Application>): Application | undefined;
    findByStatus(status: ApplicationStatus): Application[];
    findByOfficer(officerId: number): Application[];
    delete(id: number): boolean;
}
