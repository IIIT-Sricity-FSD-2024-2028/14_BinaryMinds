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
import { InspectionsService } from './inspections.service';
import { CreateInspectionDto } from './dto/create-inspection.dto';
import { UpdateInspectionDto } from './dto/update-inspection.dto';
import { SubmitInspectionReportDto } from './dto/submit-inspection-report.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Role } from '../common/enums/role.enum';
import { ApiTags } from '@nestjs/swagger';
import { ApiRoute } from '../common/swagger/api-route.decorator';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { AuthenticatedUser } from '../auth/auth-session.interface';

import { ApplicationsService } from '../applications/applications.service';
import { UsersService } from '../users/users.service';

@ApiTags('Inspections')
@Controller('inspections')
@UseGuards(RolesGuard)
export class InspectionsController {
  constructor(
    private readonly service: InspectionsService,
    private readonly auditLogsService: AuditLogsService,
    private readonly applicationsService: ApplicationsService,
    private readonly usersService: UsersService,
  ) {}

  @Post()
  @Roles(Role.DEPARTMENT_OFFICER, Role.FIELD_OFFICER, Role.SUPER_USER, Role.PLATFORM_ADMIN)
  @ApiRoute({
    summary: 'Create inspection',
    roles: [Role.DEPARTMENT_OFFICER, Role.FIELD_OFFICER, Role.SUPER_USER, Role.PLATFORM_ADMIN],
    bodyType: CreateInspectionDto,
    status: 201,
    responseExample: { inspection_id: 1, assignment_id: 1, status: 'scheduled' },
  })
  create(
    @Body() createDto: CreateInspectionDto,
    @Req() request: Request & { user: AuthenticatedUser },
  ) {
    const inspection = this.service.create(createDto);
    this.auditLogsService.log({
      user_name: request.user.fullName || 'Officer',
      role: 'officer',
      action: 'Create',
      module: 'Inspections',
      description: `Created inspection ${inspection.inspection_id}`,
      ip_address: '127.0.0.1',
      source: 'backend',
    });
    return inspection;
  }

  @Get()
  @Roles(Role.DEPARTMENT_OFFICER, Role.FIELD_OFFICER, Role.SUPER_USER, Role.PLATFORM_ADMIN)
  @ApiRoute({
    summary: 'List inspections',
    roles: [Role.DEPARTMENT_OFFICER, Role.FIELD_OFFICER, Role.SUPER_USER, Role.PLATFORM_ADMIN],
    responseExample: [{ inspection_id: 1, assignment_id: 1 }],
  })
  findAll(@Req() request: Request & { user: AuthenticatedUser }) {
    if (request.user.role === Role.PLATFORM_ADMIN) {
      return this.service.findAll();
    }
    const userMuni = request.user.municipalityId;
    if (!userMuni) return [];
    const appsInMuni = new Set(this.applicationsService.findAll(userMuni).map((a) => a.application_id));
    return this.service.findAll().filter((i) => {
      if ((i as any).application_id && appsInMuni.has((i as any).application_id)) return true;
      if ((i as any).municipality_id && (i as any).municipality_id.toLowerCase() === userMuni.toLowerCase()) return true;
      if (i.field_officer_id) {
        try {
          const fo = this.usersService.findOne(i.field_officer_id);
          if (fo && (fo.municipality_id || '').toLowerCase() === userMuni.toLowerCase()) return true;
        } catch (e) {}
      }
      return false;
    });
  }

  @Get('assignment/:assignmentId')
  @Roles(Role.DEPARTMENT_OFFICER, Role.FIELD_OFFICER, Role.SUPER_USER, Role.PLATFORM_ADMIN)
  @ApiRoute({
    summary: 'List inspections by assignment',
    roles: [Role.DEPARTMENT_OFFICER, Role.FIELD_OFFICER, Role.SUPER_USER, Role.PLATFORM_ADMIN],
    params: [{ name: 'assignmentId', description: 'Assignment ID' }],
    responseExample: [{ inspection_id: 1, assignment_id: 1 }],
  })
  findByAssignment(@Param('assignmentId', ParseIntPipe) assignmentId: number) {
    return this.service.findByAssignment(assignmentId);
  }

  @Get('field-officer/:fieldOfficerId')
  @Roles(Role.DEPARTMENT_OFFICER, Role.FIELD_OFFICER, Role.SUPER_USER, Role.PLATFORM_ADMIN)
  @ApiRoute({
    summary: 'List inspections by field officer',
    roles: [Role.DEPARTMENT_OFFICER, Role.FIELD_OFFICER, Role.SUPER_USER, Role.PLATFORM_ADMIN],
    params: [{ name: 'fieldOfficerId', description: 'Field officer user ID' }],
    responseExample: [{ inspection_id: 1, field_officer_id: 2 }],
  })
  findByFieldOfficer(
    @Param('fieldOfficerId', ParseIntPipe) fieldOfficerId: number,
    @Req() request: Request & { user: AuthenticatedUser },
  ) {
    if (request.user.role === Role.FIELD_OFFICER && request.user.userId !== fieldOfficerId) {
      throw new ForbiddenException('Field officers can only view their own inspections');
    }
    if (request.user.role !== Role.PLATFORM_ADMIN) {
      const fo = this.usersService.findOne(fieldOfficerId);
      const userMuni = request.user.municipalityId;
      if (!userMuni || (fo.municipality_id || '').toLowerCase() !== userMuni.toLowerCase()) {
        throw new ForbiddenException('Cannot view inspections for an officer outside your municipality');
      }
    }
    return this.service.findByFieldOfficer(fieldOfficerId);
  }

  @Get(':id')
  @Roles(Role.DEPARTMENT_OFFICER, Role.FIELD_OFFICER, Role.SUPER_USER, Role.PLATFORM_ADMIN)
  @ApiRoute({
    summary: 'Get inspection by ID',
    roles: [Role.DEPARTMENT_OFFICER, Role.FIELD_OFFICER, Role.SUPER_USER, Role.PLATFORM_ADMIN],
    params: [{ name: 'id', description: 'Inspection ID' }],
    responseExample: { inspection_id: 1, status: 'scheduled' },
  })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: Request & { user: AuthenticatedUser },
  ) {
    const inspection = this.service.findOne(id);
    if (request.user.role !== Role.PLATFORM_ADMIN) {
      const userMuni = request.user.municipalityId;
      let allowed = false;
      if ((inspection as any).application_id) {
        try {
          const app = this.applicationsService.findOne((inspection as any).application_id);
          if (app && (app.municipality_id || '').toLowerCase() === (userMuni || '').toLowerCase()) allowed = true;
        } catch (e) {}
      }
      if (!allowed && (inspection as any).municipality_id && (inspection as any).municipality_id.toLowerCase() === (userMuni || '').toLowerCase()) {
        allowed = true;
      }
      if (!allowed && inspection.field_officer_id) {
        try {
          const fo = this.usersService.findOne(inspection.field_officer_id);
          if (fo && (fo.municipality_id || '').toLowerCase() === (userMuni || '').toLowerCase()) allowed = true;
        } catch (e) {}
      }
      if (!allowed) {
        throw new ForbiddenException('Access denied to inspection outside your municipality');
      }
    }
    return inspection;
  }

  @Patch(':id')
  @Roles(Role.DEPARTMENT_OFFICER, Role.FIELD_OFFICER, Role.SUPER_USER, Role.PLATFORM_ADMIN)
  @ApiRoute({
    summary: 'Update inspection by ID',
    roles: [Role.DEPARTMENT_OFFICER, Role.FIELD_OFFICER, Role.SUPER_USER, Role.PLATFORM_ADMIN],
    params: [{ name: 'id', description: 'Inspection ID' }],
    bodyType: UpdateInspectionDto,
    responseExample: { inspection_id: 1, status: 'completed' },
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateInspectionDto,
    @Req() request: Request & { user: AuthenticatedUser },
  ) {
    const inspection = this.service.update(id, updateDto);
    this.auditLogsService.log({
      user_name: request.user.fullName || 'Field Officer',
      role: String(request.user.role),
      action: 'Update',
      module: 'Inspections',
      description: `Updated inspection ${id}`,
      ip_address: '127.0.0.1',
      source: 'backend',
    });
    return inspection;
  }

  @Post(':id/report')
  @Roles(Role.FIELD_OFFICER, Role.DEPARTMENT_OFFICER, Role.SUPER_USER, Role.PLATFORM_ADMIN)
  @ApiRoute({
    summary: 'Submit inspection report',
    roles: [Role.FIELD_OFFICER, Role.DEPARTMENT_OFFICER, Role.SUPER_USER, Role.PLATFORM_ADMIN],
    params: [{ name: 'id', description: 'Inspection ID' }],
    bodyType: SubmitInspectionReportDto,
    status: 201,
    responseExample: { inspection_id: 1, status: 'completed', result: 'approved' },
  })
  submitReport(
    @Param('id', ParseIntPipe) id: number,
    @Body() reportDto: SubmitInspectionReportDto,
  ) {
    return this.service.submitReport(id, reportDto);
  }

  @Delete(':id')
  @Roles(Role.DEPARTMENT_OFFICER, Role.SUPER_USER, Role.PLATFORM_ADMIN)
  @ApiRoute({
    summary: 'Delete inspection by ID',
    roles: [Role.DEPARTMENT_OFFICER, Role.SUPER_USER, Role.PLATFORM_ADMIN],
    params: [{ name: 'id', description: 'Inspection ID' }],
    responseExample: true,
  })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
