import { Injectable } from '@nestjs/common';
import { License } from './license.interface';
import { LicenseStatus } from '../common/enums/license-status.enum';
import { JsonStore } from '../common/persistence/json-store';

@Injectable()
export class LicensesRepository {
  constructor(private readonly store: JsonStore) {}

  find(): License[] {
    return this.store.snapshot().licenses;
  }

  findById(id: number): License | undefined {
    return this.find().find((l) => l.license_id === id);
  }

  findByApplication(applicationId: number): License | undefined {
    return this.find().find((l) => l.application_id === applicationId);
  }

  findByLicenseNumber(licenseNumber: string): License | undefined {
    return this.find().find((l) => l.license_number === licenseNumber);
  }

  create(license: Omit<License, 'license_id'>): License {
    const newLicense: License = {
      ...license,
      license_id: this.store.snapshot().counters.licenses++,
    };
    if (!newLicense.status) {
      newLicense.status = LicenseStatus.ACTIVE;
    }
    this.find().push(newLicense);
    this.store.save();
    return newLicense;
  }

  update(id: number, updateData: Partial<License>): License | undefined {
    const licenses = this.find();
    const index = licenses.findIndex((l) => l.license_id === id);
    if (index === -1) return undefined;

    licenses[index] = { ...licenses[index], ...updateData };
    this.store.save();
    return licenses[index];
  }

  delete(id: number): boolean {
    const licenses = this.find();
    const initialLength = licenses.length;
    const remaining = licenses.filter((l) => l.license_id !== id);
    if (remaining.length === initialLength) return false;
    licenses.splice(0, licenses.length, ...remaining);
    this.store.save();
    return true;
  }
}
