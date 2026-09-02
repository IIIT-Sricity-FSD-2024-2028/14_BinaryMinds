import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { ApiTags } from '@nestjs/swagger';
import { AuditLogsService } from './audit-logs.service';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Role } from '../common/enums/role.enum';
import { AuthenticatedUser } from '../auth/auth-session.interface';

@ApiTags('Audit Logs')
@Controller('audit-logs')
@UseGuards(RolesGuard)
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get()
  @Roles(Role.SUPER_USER, Role.PLATFORM_ADMIN)
  findAll(@Req() request: Request & { user: AuthenticatedUser }) {
    return { success: true, data: this.auditLogsService.findAll() };
  }
}
