import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ComplianceRepository } from './compliance.repository';
import { ComplianceRecord } from './compliance-record.interface';
import { CreateComplianceRecordDto } from './dto/create-compliance-record.dto';
import { ComplianceStatus } from '../common/enums/compliance-status.enum';
import { LicensesService } from '../licenses/licenses.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class ComplianceService {
  constructor(
    private readonly repository: ComplianceRepository,
    private readonly licensesService: LicensesService,
    private readonly usersService: UsersService,
  ) {}

  findAll(): ComplianceRecord[] {
    return this.repository.find();
  }

  findOne(id: number): ComplianceRecord {
    const record = this.repository.findById(id);
    if (!record) {
      throw new NotFoundException(`Compliance Record with ID ${id} not found`);
    }
    return record;
  }

  findByLicense(licenseId: number): ComplianceRecord[] {
    return this.repository.findByLicense(licenseId);
  }

  findByFieldOfficer(fieldOfficerId: number): ComplianceRecord[] {
    return this.repository.findByFieldOfficer(fieldOfficerId);
  }

  create(data: CreateComplianceRecordDto): ComplianceRecord {
    this.licensesService.findOne(data.license_id);
    this.usersService.findOne(data.field_officer_id);

    return this.repository.create({
      ...data,
      status: data.status || ComplianceStatus.ISSUED,
    });
  }

  update(id: number, updateData: Partial<ComplianceRecord>): ComplianceRecord {
    this.findOne(id); // Check existence

    const updated = this.repository.update(id, updateData);
    if (!updated) {
      throw new NotFoundException(`Compliance Record with ID ${id} not found`);
    }
    return updated;
  }

  resolveWarning(id: number): ComplianceRecord {
    const existing = this.findOne(id);
    if (existing.status === ComplianceStatus.RESOLVED) {
      throw new BadRequestException('Warning is already resolved');
    }

    return this.update(id, {
      status: ComplianceStatus.RESOLVED,
      resolved_at: new Date(),
    });
  }

  escalateWarning(id: number): ComplianceRecord {
    const existing = this.findOne(id);
    if (existing.status === ComplianceStatus.ESCALATED) {
      throw new BadRequestException('Warning is already escalated');
    }
    if (existing.status === ComplianceStatus.RESOLVED) {
      throw new BadRequestException('Cannot escalate a resolved warning');
    }

    return this.update(id, {
      status: ComplianceStatus.ESCALATED,
    });
  }

  remove(id: number): void {
    this.findOne(id);
    this.repository.delete(id);
  }
}
