import { Application } from './application.interface';
export declare class ApplicationsRepository {
    private applications;
    private idCounter;
    find(): Application[];
    findById(id: number): Application | undefined;
    findByApplicant(applicantId: number): Application[];
    create(application: Omit<Application, 'application_id' | 'submitted_at'>): Application;
    update(id: number, updateData: Partial<Application>): Application | undefined;
    delete(id: number): boolean;
}
