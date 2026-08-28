import { License } from './license.interface';
import { JsonStore } from '../common/persistence/json-store';
export declare class LicensesRepository {
    private readonly store;
    constructor(store: JsonStore);
    find(): License[];
    findById(id: number): License | undefined;
    findByApplication(applicationId: number): License | undefined;
    findByLicenseNumber(licenseNumber: string): License | undefined;
    create(license: Omit<License, 'license_id'>): License;
    update(id: number, updateData: Partial<License>): License | undefined;
    delete(id: number): boolean;
}
