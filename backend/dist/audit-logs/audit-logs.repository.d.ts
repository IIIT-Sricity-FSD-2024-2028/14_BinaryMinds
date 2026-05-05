import { AuditLogEntry } from './audit-log.interface';
export declare class AuditLogsRepository {
    private logs;
    private idCounter;
    find(): AuditLogEntry[];
    create(entry: Omit<AuditLogEntry, 'audit_id' | 'timestamp'> & {
        timestamp?: Date;
    }): AuditLogEntry;
}
