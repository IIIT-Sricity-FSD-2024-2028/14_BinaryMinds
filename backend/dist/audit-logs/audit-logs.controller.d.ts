import { AuditLogsService } from './audit-logs.service';
export declare class AuditLogsController {
    private readonly auditLogsService;
    constructor(auditLogsService: AuditLogsService);
    findAll(): {
        success: boolean;
        data: import("./audit-log.interface").AuditLogEntry[];
    };
    create(body: {
        user_name?: string;
        role?: string;
        action?: string;
        module?: string;
        description?: string;
        ip_address?: string;
        source?: 'frontend' | 'backend';
    }): {
        success: boolean;
        data: import("./audit-log.interface").AuditLogEntry;
    };
}
