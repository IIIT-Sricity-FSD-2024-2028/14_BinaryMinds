import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ForbiddenException,
  ParseIntPipe,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { LicensesService } from './licenses.service';
import { CreateLicenseDto } from './dto/create-license.dto';
import { UpdateLicenseDto } from './dto/update-license.dto';
import { RenewLicenseDto } from './dto/renew-license.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Role } from '../common/enums/role.enum';
import { ApiTags } from '@nestjs/swagger';
import { ApiRoute } from '../common/swagger/api-route.decorator';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { AuthenticatedUser } from '../auth/auth-session.interface';
import { ApplicationsService } from '../applications/applications.service';

@ApiTags('Licenses')
@Controller('licenses')
@UseGuards(RolesGuard)
export class LicensesController {
  constructor(
    private readonly service: LicensesService,
    private readonly auditLogsService: AuditLogsService,
    private readonly applicationsService: ApplicationsService,
  ) {}

  @Post()
  @Roles(Role.DEPARTMENT_OFFICER, Role.SUPER_USER, Role.PLATFORM_ADMIN)
  @ApiRoute({
    summary: 'Create license',
    roles: [Role.DEPARTMENT_OFFICER, Role.SUPER_USER, Role.PLATFORM_ADMIN],
    bodyType: CreateLicenseDto,
    status: 201,
    responseExample: { license_id: 1, license_number: 'LIC-20260505-1234', status: 'active' },
  })
  create(
    @Body() createDto: CreateLicenseDto,
    @Req() request: Request & { user: AuthenticatedUser },
  ) {
    const app = this.applicationsService.findOne(createDto.application_id);
    if (request.user.role !== Role.PLATFORM_ADMIN) {
      const userMuni = request.user.municipalityId;
      if (!userMuni || (app.municipality_id || '').toLowerCase() !== userMuni.toLowerCase()) {
        throw new ForbiddenException('Cannot issue license for application belonging to another municipality');
      }
    }

    const license = this.service.create(createDto);
    this.auditLogsService.log({
      user_name: request.user.fullName || 'Department Officer',
      role: String(request.user.role),
      action: 'Create',
      module: 'Licenses',
      description: `Created license ${license.license_number || license.license_id}`,
      ip_address: '127.0.0.1',
      source: 'backend',
    });
    return license;
  }

  @Get()
  @Roles(Role.DEPARTMENT_OFFICER, Role.SUPER_USER, Role.FIELD_OFFICER, Role.PLATFORM_ADMIN)
  @ApiRoute({
    summary: 'List licenses',
    roles: [Role.DEPARTMENT_OFFICER, Role.SUPER_USER, Role.FIELD_OFFICER, Role.PLATFORM_ADMIN],
    responseExample: [{ license_id: 1, license_number: 'LIC-20260505-1234' }],
  })
  findAll(@Req() request: Request & { user: AuthenticatedUser }) {
    if (request.user.role === Role.PLATFORM_ADMIN) {
      return this.service.findAll();
    }
    const userMuni = request.user.municipalityId;
    if (!userMuni) return [];
    return this.service
      .findAll()
      .filter((l) => (l.municipality_id || '').toLowerCase() === userMuni.toLowerCase());
  }

  @Get('application/:applicationId')
  @Roles(Role.DEPARTMENT_OFFICER, Role.SUPER_USER, Role.FIELD_OFFICER, Role.APPLICANT, Role.PLATFORM_ADMIN)
  @ApiRoute({
    summary: 'Get license by application',
    roles: [Role.DEPARTMENT_OFFICER, Role.SUPER_USER, Role.FIELD_OFFICER, Role.APPLICANT, Role.PLATFORM_ADMIN],
    params: [{ name: 'applicationId', description: 'Application ID' }],
    responseExample: { license_id: 1, application_id: 1 },
  })
  findByApplication(
    @Param('applicationId', ParseIntPipe) applicationId: number,
    @Req() request: Request & { user: AuthenticatedUser },
  ) {
    const license = this.service.findByApplication(applicationId);
    if (request.user.role !== Role.PLATFORM_ADMIN) {
      const userMuni = request.user.municipalityId;
      if (
        request.user.role !== Role.APPLICANT &&
        (!userMuni || (license.municipality_id || '').toLowerCase() !== userMuni.toLowerCase())
      ) {
        throw new ForbiddenException('Access denied to license outside your municipality');
      }
    }
    return license;
  }

  @Get('number/:licenseNumber')
  @Roles(Role.DEPARTMENT_OFFICER, Role.SUPER_USER, Role.FIELD_OFFICER, Role.APPLICANT, Role.PLATFORM_ADMIN)
  @ApiRoute({
    summary: 'Get license by license number',
    roles: [Role.DEPARTMENT_OFFICER, Role.SUPER_USER, Role.FIELD_OFFICER, Role.APPLICANT, Role.PLATFORM_ADMIN],
    params: [{ name: 'licenseNumber', description: 'License number', type: 'string' }],
    responseExample: { license_id: 1, license_number: 'LIC-20260505-1234' },
  })
  findByLicenseNumber(@Param('licenseNumber') licenseNumber: string) {
    return this.service.findByLicenseNumber(licenseNumber);
  }

  @Get(':id')
  @Roles(Role.DEPARTMENT_OFFICER, Role.SUPER_USER, Role.FIELD_OFFICER, Role.APPLICANT, Role.PLATFORM_ADMIN)
  @ApiRoute({
    summary: 'Get license by ID',
    roles: [Role.DEPARTMENT_OFFICER, Role.SUPER_USER, Role.FIELD_OFFICER, Role.APPLICANT, Role.PLATFORM_ADMIN],
    params: [{ name: 'id', description: 'License ID' }],
    responseExample: { license_id: 1, license_number: 'LIC-20260505-1234' },
  })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: Request & { user: AuthenticatedUser },
  ) {
    const license = this.service.findOne(id);
    if (request.user.role !== Role.PLATFORM_ADMIN && request.user.role !== Role.APPLICANT) {
      const userMuni = request.user.municipalityId;
      if (!userMuni || (license.municipality_id || '').toLowerCase() !== userMuni.toLowerCase()) {
        throw new ForbiddenException('Access denied to license outside your municipality');
      }
    }
    return license;
  }

  @Patch(':id')
  @Roles(Role.DEPARTMENT_OFFICER, Role.SUPER_USER, Role.PLATFORM_ADMIN)
  @ApiRoute({
    summary: 'Update license by ID',
    roles: [Role.DEPARTMENT_OFFICER, Role.SUPER_USER, Role.PLATFORM_ADMIN],
    params: [{ name: 'id', description: 'License ID' }],
    bodyType: UpdateLicenseDto,
    responseExample: { license_id: 1, status: 'active' },
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateLicenseDto,
    @Req() request: Request & { user: AuthenticatedUser },
  ) {
    const existing = this.service.findOne(id);
    if (request.user.role !== Role.PLATFORM_ADMIN) {
      const userMuni = request.user.municipalityId;
      if (!userMuni || (existing.municipality_id || '').toLowerCase() !== userMuni.toLowerCase()) {
        throw new ForbiddenException('Access denied to modify license outside your municipality');
      }
    }

    const license = this.service.update(id, updateDto);
    this.auditLogsService.log({
      user_name: request.user.fullName || 'Department Officer',
      role: String(request.user.role),
      action: 'Update',
      module: 'Licenses',
      description: `Updated license ${id}`,
      ip_address: '127.0.0.1',
      source: 'backend',
    });
    return license;
  }

  @Post(':id/suspend')
  @Roles(Role.DEPARTMENT_OFFICER, Role.SUPER_USER, Role.PLATFORM_ADMIN)
  @ApiRoute({
    summary: 'Suspend license',
    roles: [Role.DEPARTMENT_OFFICER, Role.SUPER_USER, Role.PLATFORM_ADMIN],
    params: [{ name: 'id', description: 'License ID' }],
    status: 201,
    responseExample: { license_id: 1, status: 'suspended' },
  })
  suspend(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: Request & { user: AuthenticatedUser },
  ) {
    const existing = this.service.findOne(id);
    if (request.user.role !== Role.PLATFORM_ADMIN) {
      const userMuni = request.user.municipalityId;
      if (!userMuni || (existing.municipality_id || '').toLowerCase() !== userMuni.toLowerCase()) {
        throw new ForbiddenException('Access denied to suspend license outside your municipality');
      }
    }
    return this.service.suspend(id);
  }

  @Post(':id/revoke')
  @Roles(Role.DEPARTMENT_OFFICER, Role.SUPER_USER, Role.PLATFORM_ADMIN)
  @ApiRoute({
    summary: 'Revoke license',
    roles: [Role.DEPARTMENT_OFFICER, Role.SUPER_USER, Role.PLATFORM_ADMIN],
    params: [{ name: 'id', description: 'License ID' }],
    status: 201,
    responseExample: { license_id: 1, status: 'revoked' },
  })
  revoke(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: Request & { user: AuthenticatedUser },
  ) {
    const existing = this.service.findOne(id);
    if (request.user.role !== Role.PLATFORM_ADMIN) {
      const userMuni = request.user.municipalityId;
      if (!userMuni || (existing.municipality_id || '').toLowerCase() !== userMuni.toLowerCase()) {
        throw new ForbiddenException('Access denied to revoke license outside your municipality');
      }
    }
    return this.service.revoke(id);
  }

  @Post(':id/renew')
  @Roles(Role.DEPARTMENT_OFFICER, Role.SUPER_USER, Role.PLATFORM_ADMIN)
  @ApiRoute({
    summary: 'Renew license',
    roles: [Role.DEPARTMENT_OFFICER, Role.SUPER_USER, Role.PLATFORM_ADMIN],
    params: [{ name: 'id', description: 'License ID' }],
    bodyType: RenewLicenseDto,
    status: 201,
    responseExample: { license_id: 1, status: 'active', expiry_date: '2027-05-05T00:00:00.000Z' },
  })
  renew(
    @Param('id', ParseIntPipe) id: number,
    @Body() renewDto: RenewLicenseDto,
    @Req() request: Request & { user: AuthenticatedUser },
  ) {
    const existing = this.service.findOne(id);
    if (request.user.role !== Role.PLATFORM_ADMIN) {
      const userMuni = request.user.municipalityId;
      if (!userMuni || (existing.municipality_id || '').toLowerCase() !== userMuni.toLowerCase()) {
        throw new ForbiddenException('Access denied to renew license outside your municipality');
      }
    }
    return this.service.renew(id, renewDto.new_expiry_date);
  }

  @Delete(':id')
  @Roles(Role.SUPER_USER, Role.PLATFORM_ADMIN)
  @ApiRoute({
    summary: 'Delete license by ID',
    roles: [Role.SUPER_USER, Role.PLATFORM_ADMIN],
    params: [{ name: 'id', description: 'License ID' }],
    responseExample: true,
  })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: Request & { user: AuthenticatedUser },
  ) {
    const existing = this.service.findOne(id);
    if (request.user.role !== Role.PLATFORM_ADMIN) {
      const userMuni = request.user.municipalityId;
      if (!userMuni || (existing.municipality_id || '').toLowerCase() !== userMuni.toLowerCase()) {
        throw new ForbiddenException('Access denied to delete license outside your municipality');
      }
    }
    return this.service.remove(id);
  }
}

