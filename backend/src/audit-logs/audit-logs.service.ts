import { Injectable } from '@nestjs/common';
import { AuditLogEntry } from './audit-log.interface';
import { AuditLogsRepository } from './audit-logs.repository';

@Injectable()
export class AuditLogsService {
  constructor(private readonly repository: AuditLogsRepository) {}

  findAll(): AuditLogEntry[] {
    return this.repository.find();
  }

  log(entry: Omit<AuditLogEntry, 'audit_id' | 'timestamp'> & { timestamp?: Date }): AuditLogEntry {
    return this.repository.create(entry);
  }
}
