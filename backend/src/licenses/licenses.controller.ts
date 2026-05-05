import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
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

@ApiTags('Licenses')
@Controller('licenses')
@UseGuards(RolesGuard)
export class LicensesController {
  constructor(
    private readonly service: LicensesService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  @Post()
  @Roles(Role.DEPARTMENT_OFFICER, Role.SUPER_USER)
  @ApiRoute({
    summary: 'Create license',
    roles: [Role.DEPARTMENT_OFFICER, Role.SUPER_USER],
    bodyType: CreateLicenseDto,
    status: 201,
    responseExample: { license_id: 1, license_number: 'LIC-20260505-1234', status: 'active' },
  })
  create(@Body() createDto: CreateLicenseDto) {
    const license = this.service.create(createDto);
    this.auditLogsService.log({
      user_name: 'Department Officer',
      role: 'department_officer',
      action: 'Create',
      module: 'Licenses',
      description: `Created license ${license.license_number || license.license_id}`,
      ip_address: '127.0.0.1',
      source: 'backend',
    });
    return license;
  }

  @Get()
  @Roles(Role.DEPARTMENT_OFFICER, Role.SUPER_USER, Role.FIELD_OFFICER)
  @ApiRoute({
    summary: 'List licenses',
    roles: [Role.DEPARTMENT_OFFICER, Role.SUPER_USER, Role.FIELD_OFFICER],
    responseExample: [{ license_id: 1, license_number: 'LIC-20260505-1234' }],
  })
  findAll() {
    return this.service.findAll();
  }

  @Get('application/:applicationId')
  @Roles(Role.DEPARTMENT_OFFICER, Role.SUPER_USER, Role.FIELD_OFFICER, Role.APPLICANT)
  @ApiRoute({
    summary: 'Get license by application',
    roles: [Role.DEPARTMENT_OFFICER, Role.SUPER_USER, Role.FIELD_OFFICER, Role.APPLICANT],
    params: [{ name: 'applicationId', description: 'Application ID' }],
    responseExample: { license_id: 1, application_id: 1 },
  })
  findByApplication(@Param('applicationId', ParseIntPipe) applicationId: number) {
    return this.service.findByApplication(applicationId);
  }

  @Get('number/:licenseNumber')
  @Roles(Role.DEPARTMENT_OFFICER, Role.SUPER_USER, Role.FIELD_OFFICER, Role.APPLICANT)
  @ApiRoute({
    summary: 'Get license by license number',
    roles: [Role.DEPARTMENT_OFFICER, Role.SUPER_USER, Role.FIELD_OFFICER, Role.APPLICANT],
    params: [{ name: 'licenseNumber', description: 'License number', type: 'string' }],
    responseExample: { license_id: 1, license_number: 'LIC-20260505-1234' },
  })
  findByLicenseNumber(@Param('licenseNumber') licenseNumber: string) {
    return this.service.findByLicenseNumber(licenseNumber);
  }

  @Get(':id')
  @Roles(Role.DEPARTMENT_OFFICER, Role.SUPER_USER, Role.FIELD_OFFICER, Role.APPLICANT)
  @ApiRoute({
    summary: 'Get license by ID',
    roles: [Role.DEPARTMENT_OFFICER, Role.SUPER_USER, Role.FIELD_OFFICER, Role.APPLICANT],
    params: [{ name: 'id', description: 'License ID' }],
    responseExample: { license_id: 1, license_number: 'LIC-20260505-1234' },
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.DEPARTMENT_OFFICER, Role.SUPER_USER)
  @ApiRoute({
    summary: 'Update license by ID',
    roles: [Role.DEPARTMENT_OFFICER, Role.SUPER_USER],
    params: [{ name: 'id', description: 'License ID' }],
    bodyType: UpdateLicenseDto,
    responseExample: { license_id: 1, status: 'active' },
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateLicenseDto,
  ) {
    const license = this.service.update(id, updateDto);
    this.auditLogsService.log({
      user_name: 'Department Officer',
      role: 'department_officer',
      action: 'Update',
      module: 'Licenses',
      description: `Updated license ${id}`,
      ip_address: '127.0.0.1',
      source: 'backend',
    });
    return license;
  }

  @Post(':id/suspend')
  @Roles(Role.DEPARTMENT_OFFICER, Role.SUPER_USER)
  @ApiRoute({
    summary: 'Suspend license',
    roles: [Role.DEPARTMENT_OFFICER, Role.SUPER_USER],
    params: [{ name: 'id', description: 'License ID' }],
    status: 201,
    responseExample: { license_id: 1, status: 'suspended' },
  })
  suspend(@Param('id', ParseIntPipe) id: number) {
    return this.service.suspend(id);
  }

  @Post(':id/revoke')
  @Roles(Role.DEPARTMENT_OFFICER, Role.SUPER_USER)
  @ApiRoute({
    summary: 'Revoke license',
    roles: [Role.DEPARTMENT_OFFICER, Role.SUPER_USER],
    params: [{ name: 'id', description: 'License ID' }],
    status: 201,
    responseExample: { license_id: 1, status: 'revoked' },
  })
  revoke(@Param('id', ParseIntPipe) id: number) {
    return this.service.revoke(id);
  }

  @Post(':id/renew')
  @Roles(Role.DEPARTMENT_OFFICER, Role.SUPER_USER)
  @ApiRoute({
    summary: 'Renew license',
    roles: [Role.DEPARTMENT_OFFICER, Role.SUPER_USER],
    params: [{ name: 'id', description: 'License ID' }],
    bodyType: RenewLicenseDto,
    status: 201,
    responseExample: { license_id: 1, status: 'active', expiry_date: '2027-05-05T00:00:00.000Z' },
  })
  renew(
    @Param('id', ParseIntPipe) id: number,
    @Body() renewDto: RenewLicenseDto,
  ) {
    return this.service.renew(id, renewDto.new_expiry_date);
  }

  @Delete(':id')
  @Roles(Role.SUPER_USER)
  @ApiRoute({
    summary: 'Delete license by ID',
    roles: [Role.SUPER_USER],
    params: [{ name: 'id', description: 'License ID' }],
    responseExample: true,
  })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
