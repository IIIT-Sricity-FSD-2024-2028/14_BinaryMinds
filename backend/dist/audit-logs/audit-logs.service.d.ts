import { AuditLogEntry } from './audit-log.interface';
import { AuditLogsRepository } from './audit-logs.repository';
export declare class AuditLogsService {
    private readonly repository;
    constructor(repository: AuditLogsRepository);
    findAll(): AuditLogEntry[];
    log(entry: Omit<AuditLogEntry, 'audit_id' | 'timestamp'> & {
        timestamp?: Date;
    }): AuditLogEntry;
}
