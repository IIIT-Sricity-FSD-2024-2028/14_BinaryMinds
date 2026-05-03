import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { LicensesRepository } from './licenses.repository';
import { License } from './license.interface';
import { CreateLicenseDto } from './dto/create-license.dto';
import { LicenseStatus } from '../common/enums/license-status.enum';
import { ApplicationsService } from '../applications/applications.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class LicensesService {
  constructor(
    private readonly repository: LicensesRepository,
    private readonly applicationsService: ApplicationsService,
    private readonly usersService: UsersService,
  ) {}

  findAll(): License[] {
    return this.repository.find();
  }

  findOne(id: number): License {
    const license = this.repository.findById(id);
    if (!license) {
      throw new NotFoundException(`License with ID ${id} not found`);
    }
    return license;
  }

  findByApplication(applicationId: number): License {
    const license = this.repository.findByApplication(applicationId);
    if (!license) {
      throw new NotFoundException(`License for Application ID ${applicationId} not found`);
    }
    return license;
  }

  findByLicenseNumber(licenseNumber: string): License {
    const license = this.repository.findByLicenseNumber(licenseNumber);
    if (!license) {
      throw new NotFoundException(`License with number ${licenseNumber} not found`);
    }
    return license;
  }

  private generateLicenseNumber(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    // Generate a 4-digit random number
    const randomPortion = Math.floor(1000 + Math.random() * 9000);
    
    return `LIC-${year}${month}${day}-${randomPortion}`;
  }

  create(data: CreateLicenseDto): License {
    this.applicationsService.findOne(data.application_id);
    this.usersService.findOne(data.issued_by);
    
    const existing = this.repository.findByApplication(data.application_id);
    if (existing) {
       throw new BadRequestException('Application already has an issued license');
    }

    const licenseNumber = this.generateLicenseNumber();

    return this.repository.create({
      application_id: data.application_id,
      issued_by: data.issued_by,
      license_number: licenseNumber,
      issued_date: new Date(),
      expiry_date: data.expiry_date,
      status: LicenseStatus.ACTIVE,
    });
  }

  update(id: number, updateData: Partial<License>): License {
    this.findOne(id);

    const updated = this.repository.update(id, updateData);
    if (!updated) {
      throw new NotFoundException(`License with ID ${id} not found`);
    }
    return updated;
  }

  suspend(id: number): License {
    const existing = this.findOne(id);
    if (existing.status === LicenseStatus.REVOKED) {
      throw new BadRequestException('Cannot suspend a revoked license');
    }
    if (existing.status === LicenseStatus.SUSPENDED) {
      throw new BadRequestException('License is already suspended');
    }
    return this.update(id, { status: LicenseStatus.SUSPENDED });
  }

  revoke(id: number): License {
    const existing = this.findOne(id);
    if (existing.status === LicenseStatus.REVOKED) {
      throw new BadRequestException('License is already revoked');
    }
    return this.update(id, { status: LicenseStatus.REVOKED });
  }

  renew(id: number, newExpiryDate: Date): License {
    const existing = this.findOne(id);
    if (existing.status === LicenseStatus.REVOKED) {
      throw new BadRequestException('Cannot renew a revoked license');
    }
    
    const now = new Date();
    if (new Date(newExpiryDate) <= now) {
      throw new BadRequestException('Renewal expiry date must be in the future');
    }

    return this.update(id, { 
      expiry_date: newExpiryDate,
      status: LicenseStatus.ACTIVE,
    });
  }

  remove(id: number): void {
    this.findOne(id);
    this.repository.delete(id);
  }
}
