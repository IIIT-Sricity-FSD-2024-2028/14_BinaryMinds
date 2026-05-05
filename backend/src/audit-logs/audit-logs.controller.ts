import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuditLogsService } from './audit-logs.service';

@ApiTags('Audit Logs')
@Controller('audit-logs')
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get()
  findAll() {
    return { success: true, data: this.auditLogsService.findAll() };
  }

  @Post()
  create(
    @Body()
    body: {
      user_name?: string;
      role?: string;
      action?: string;
      module?: string;
      description?: string;
      ip_address?: string;
      source?: 'frontend' | 'backend';
    },
  ) {
    return {
      success: true,
      data: this.auditLogsService.log({
        user_name: body.user_name || 'System',
        role: body.role || 'Unknown',
        action: body.action || 'Update',
        module: body.module || 'System',
        description: body.description || 'Activity recorded',
        ip_address: body.ip_address || '127.0.0.1',
        source: body.source || 'frontend',
      }),
    };
  }
}
