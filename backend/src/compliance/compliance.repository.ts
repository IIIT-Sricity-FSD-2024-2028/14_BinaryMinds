import { Injectable } from '@nestjs/common';
import { ComplianceRecord } from './compliance-record.interface';
import { ComplianceStatus } from '../common/enums/compliance-status.enum';

@Injectable()
export class ComplianceRepository {
  private records: ComplianceRecord[] = [];
  private idCounter = 1;

  find(): ComplianceRecord[] {
    return this.records;
  }

  findById(id: number): ComplianceRecord | undefined {
    return this.records.find((r) => r.record_id === id);
  }

  findByLicense(licenseId: number): ComplianceRecord[] {
    return this.records.filter((r) => r.license_id === licenseId);
  }

  findByFieldOfficer(fieldOfficerId: number): ComplianceRecord[] {
    return this.records.filter((r) => r.field_officer_id === fieldOfficerId);
  }

  create(record: Omit<ComplianceRecord, 'record_id' | 'issued_at'>): ComplianceRecord {
    const newRecord: ComplianceRecord = {
      ...record,
      record_id: this.idCounter++,
      issued_at: new Date(),
    };
    if (!newRecord.status) {
      newRecord.status = ComplianceStatus.ISSUED;
    }
    this.records.push(newRecord);
    return newRecord;
  }

  update(id: number, updateData: Partial<ComplianceRecord>): ComplianceRecord | undefined {
    const index = this.records.findIndex((r) => r.record_id === id);
    if (index === -1) return undefined;

    this.records[index] = { ...this.records[index], ...updateData };
    return this.records[index];
  }

  delete(id: number): boolean {
    const initialLength = this.records.length;
    this.records = this.records.filter((r) => r.record_id !== id);
    return this.records.length !== initialLength;
  }
}
