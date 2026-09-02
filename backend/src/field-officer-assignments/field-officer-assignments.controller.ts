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
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';
import { FieldOfficerAssignmentsService } from './field-officer-assignments.service';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { UpdateAssignmentDto } from './dto/update-assignment.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Role } from '../common/enums/role.enum';
import { ApiTags } from '@nestjs/swagger';
import { ApiRoute } from '../common/swagger/api-route.decorator';

import { AuthenticatedUser } from '../auth/auth-session.interface';
import { ApplicationsService } from '../applications/applications.service';
import { UsersService } from '../users/users.service';

@ApiTags('Field Officer Assignments')
@Controller('field-officer-assignments')
@UseGuards(RolesGuard)
export class FieldOfficerAssignmentsController {
  constructor(
    private readonly service: FieldOfficerAssignmentsService,
    private readonly applicationsService: ApplicationsService,
    private readonly usersService: UsersService,
  ) {}

  @Post()
  @Roles(Role.DEPARTMENT_OFFICER, Role.SUPER_USER, Role.PLATFORM_ADMIN)
  @ApiRoute({
    summary: 'Create field officer assignment',
    roles: [Role.DEPARTMENT_OFFICER, Role.SUPER_USER, Role.PLATFORM_ADMIN],
    bodyType: CreateAssignmentDto,
    status: 201,
    responseExample: { assignment_id: 1, application_id: 1, field_officer_id: 2 },
  })
  create(@Body() createDto: CreateAssignmentDto) {
    return this.service.create(createDto);
  }

  @Get()
  @Roles(Role.DEPARTMENT_OFFICER, Role.SUPER_USER, Role.PLATFORM_ADMIN)
  @ApiRoute({
    summary: 'List field officer assignments',
    roles: [Role.DEPARTMENT_OFFICER, Role.SUPER_USER, Role.PLATFORM_ADMIN],
    responseExample: [{ assignment_id: 1, application_id: 1 }],
  })
  findAll(@Req() request: Request & { user: AuthenticatedUser }) {
    if (request.user.role === Role.PLATFORM_ADMIN) {
      return this.service.findAll();
    }
    const userMuni = request.user.municipalityId;
    if (!userMuni) return [];
    const appsInMuni = new Set(this.applicationsService.findAll(userMuni).map((a) => a.application_id));
    return this.service.findAll().filter((a) => appsInMuni.has(a.application_id));
  }

  @Get('application/:applicationId')
  @Roles(Role.DEPARTMENT_OFFICER, Role.FIELD_OFFICER, Role.SUPER_USER, Role.PLATFORM_ADMIN)
  @ApiRoute({
    summary: 'List assignments by application',
    roles: [Role.DEPARTMENT_OFFICER, Role.FIELD_OFFICER, Role.SUPER_USER, Role.PLATFORM_ADMIN],
    params: [{ name: 'applicationId', description: 'Application ID' }],
    responseExample: [{ assignment_id: 1, application_id: 1 }],
  })
  findByApplication(
    @Param('applicationId', ParseIntPipe) applicationId: number,
    @Req() request: Request & { user: AuthenticatedUser },
  ) {
    const app = this.applicationsService.findOne(applicationId);
    if (request.user.role !== Role.PLATFORM_ADMIN && request.user.role !== Role.APPLICANT) {
      const userMuni = request.user.municipalityId;
      if (!userMuni || (app.municipality_id || '').toLowerCase() !== userMuni.toLowerCase()) {
        throw new ForbiddenException('Access denied to assignment outside your municipality');
      }
    }
    return this.service.findByApplication(applicationId);
  }

  @Get('field-officer/:fieldOfficerId')
  @Roles(Role.DEPARTMENT_OFFICER, Role.FIELD_OFFICER, Role.SUPER_USER, Role.PLATFORM_ADMIN)
  @ApiRoute({
    summary: 'List assignments by field officer',
    roles: [Role.DEPARTMENT_OFFICER, Role.FIELD_OFFICER, Role.SUPER_USER, Role.PLATFORM_ADMIN],
    params: [{ name: 'fieldOfficerId', description: 'Field officer user ID' }],
    responseExample: [{ assignment_id: 1, field_officer_id: 2 }],
  })
  findByFieldOfficer(
    @Param('fieldOfficerId', ParseIntPipe) fieldOfficerId: number,
    @Req() request: Request & { user: AuthenticatedUser },
  ) {
    if (request.user.role === Role.FIELD_OFFICER && request.user.userId !== fieldOfficerId) {
      throw new ForbiddenException('Field officers can only view their own assignments');
    }
    if (request.user.role !== Role.PLATFORM_ADMIN) {
      const fo = this.usersService.findOne(fieldOfficerId);
      const userMuni = request.user.municipalityId;
      if (!userMuni || (fo.municipality_id || '').toLowerCase() !== userMuni.toLowerCase()) {
        throw new ForbiddenException('Cannot view assignments for an officer outside your municipality');
      }
    }
    return this.service.findByFieldOfficer(fieldOfficerId);
  }

  @Get(':id')
  @Roles(Role.DEPARTMENT_OFFICER, Role.FIELD_OFFICER, Role.SUPER_USER, Role.PLATFORM_ADMIN)
  @ApiRoute({
    summary: 'Get assignment by ID',
    roles: [Role.DEPARTMENT_OFFICER, Role.FIELD_OFFICER, Role.SUPER_USER, Role.PLATFORM_ADMIN],
    params: [{ name: 'id', description: 'Assignment ID' }],
    responseExample: { assignment_id: 1, application_id: 1 },
  })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: Request & { user: AuthenticatedUser },
  ) {
    const assignment = this.service.findOne(id);
    if (request.user.role !== Role.PLATFORM_ADMIN) {
      const app = this.applicationsService.findOne(assignment.application_id);
      const userMuni = request.user.municipalityId;
      if (!userMuni || (app.municipality_id || '').toLowerCase() !== userMuni.toLowerCase()) {
        throw new ForbiddenException('Access denied to assignment outside your municipality');
      }
    }
    return assignment;
  }

  @Patch(':id')
  @Roles(Role.DEPARTMENT_OFFICER, Role.FIELD_OFFICER)
  @ApiRoute({
    summary: 'Update assignment by ID',
    roles: [Role.DEPARTMENT_OFFICER, Role.FIELD_OFFICER],
    params: [{ name: 'id', description: 'Assignment ID' }],
    bodyType: UpdateAssignmentDto,
    responseExample: { assignment_id: 1, assignment_status: 'completed' },
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateAssignmentDto,
  ) {
    return this.service.update(id, updateDto);
  }

  @Get(':id/sla')
  @Roles(Role.DEPARTMENT_OFFICER, Role.FIELD_OFFICER)
  @ApiRoute({
    summary: 'Check assignment SLA',
    roles: [Role.DEPARTMENT_OFFICER, Role.FIELD_OFFICER],
    params: [{ name: 'id', description: 'Assignment ID' }],
    responseExample: { assignment_id: 1, slaBreached: false },
  })
  checkSLA(@Param('id', ParseIntPipe) id: number) {
    return this.service.checkSLA(id);
  }

  @Delete(':id')
  @Roles(Role.DEPARTMENT_OFFICER)
  @ApiRoute({
    summary: 'Delete assignment by ID',
    roles: [Role.DEPARTMENT_OFFICER],
    params: [{ name: 'id', description: 'Assignment ID' }],
    responseExample: true,
  })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
