import { AuditLogsService } from './audit-logs.service';
export declare class AuditLogsController {
    private readonly auditLogsService;
    constructor(auditLogsService: AuditLogsService);
    findAll(): {
        success: boolean;
        data: import("./audit-log.interface").AuditLogEntry[];
    };
}
