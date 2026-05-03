import { Injectable } from '@nestjs/common';
import { License } from './license.interface';
import { LicenseStatus } from '../common/enums/license-status.enum';

@Injectable()
export class LicensesRepository {
  private licenses: License[] = [];
  private idCounter = 1;

  find(): License[] {
    return this.licenses;
  }

  findById(id: number): License | undefined {
    return this.licenses.find((l) => l.license_id === id);
  }

  findByApplication(applicationId: number): License | undefined {
    return this.licenses.find((l) => l.application_id === applicationId);
  }

  findByLicenseNumber(licenseNumber: string): License | undefined {
    return this.licenses.find((l) => l.license_number === licenseNumber);
  }

  create(license: Omit<License, 'license_id'>): License {
    const newLicense: License = {
      ...license,
      license_id: this.idCounter++,
    };
    if (!newLicense.status) {
      newLicense.status = LicenseStatus.ACTIVE;
    }
    this.licenses.push(newLicense);
    return newLicense;
  }

  update(id: number, updateData: Partial<License>): License | undefined {
    const index = this.licenses.findIndex((l) => l.license_id === id);
    if (index === -1) return undefined;

    this.licenses[index] = { ...this.licenses[index], ...updateData };
    return this.licenses[index];
  }

  delete(id: number): boolean {
    const initialLength = this.licenses.length;
    this.licenses = this.licenses.filter((l) => l.license_id !== id);
    return this.licenses.length !== initialLength;
  }
}
