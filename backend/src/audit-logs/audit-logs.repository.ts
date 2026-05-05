import { Injectable } from '@nestjs/common';
import { AuditLogEntry } from './audit-log.interface';

@Injectable()
export class AuditLogsRepository {
  private logs: AuditLogEntry[] = [];
  private idCounter = 1;

  find(): AuditLogEntry[] {
    return this.logs;
  }

  create(entry: Omit<AuditLogEntry, 'audit_id' | 'timestamp'> & { timestamp?: Date }): AuditLogEntry {
    const newEntry: AuditLogEntry = {
      ...entry,
      audit_id: this.idCounter++,
      timestamp: entry.timestamp || new Date(),
    };
    this.logs.unshift(newEntry);
    return newEntry;
  }
}
