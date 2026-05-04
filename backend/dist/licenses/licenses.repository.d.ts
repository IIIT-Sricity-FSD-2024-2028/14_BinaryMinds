import { License } from './license.interface';
export declare class LicensesRepository {
    private licenses;
    private idCounter;
    find(): License[];
    findById(id: number): License | undefined;
    findByApplication(applicationId: number): License | undefined;
    findByLicenseNumber(licenseNumber: string): License | undefined;
    create(license: Omit<License, 'license_id'>): License;
    update(id: number, updateData: Partial<License>): License | undefined;
    delete(id: number): boolean;
}
