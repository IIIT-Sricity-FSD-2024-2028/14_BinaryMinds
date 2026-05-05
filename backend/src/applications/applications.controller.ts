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
import { ApplicationsService } from './applications.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { CreateSimpleApplicationDto } from './dto/create-simple-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Role } from '../common/enums/role.enum';
import { ApiExtraModels, ApiTags } from '@nestjs/swagger';
import { ApiRoute } from '../common/swagger/api-route.decorator';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@ApiTags('Applications')
@ApiExtraModels(CreateApplicationDto, CreateSimpleApplicationDto)
@Controller('applications')
@UseGuards(RolesGuard)
export class ApplicationsController {
  constructor(
    private readonly applicationsService: ApplicationsService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  // ── NEW WORKFLOW ENDPOINTS ───────────────────────────────────────────

  @Post()
  @Roles(Role.APPLICANT, Role.DEPARTMENT_OFFICER, Role.SUPER_USER)
  @ApiRoute({
    summary: 'Create a new application',
    description: 'Accepts either the full application payload or the simplified applicant workflow payload.',
    roles: [Role.APPLICANT, Role.DEPARTMENT_OFFICER, Role.SUPER_USER],
    bodyTypes: [CreateApplicationDto, CreateSimpleApplicationDto],
    status: 201,
    responseDescription: 'Application created.',
    wrappedResponse: true,
    responseExample: { application_id: 1, application_status: 'submitted' },
    notFound: true,
  })
  create(@Body() body: CreateApplicationDto | CreateSimpleApplicationDto) {
    // If simplified DTO (only applicantName), use createSimple
    if ('applicantName' in body && !('applicant_id' in body)) {
      const app = this.applicationsService.createSimple(
        body as CreateSimpleApplicationDto,
      );
      this.auditLogsService.log({
        user_name: (app as any).full_name || (body as CreateSimpleApplicationDto).applicantName || 'Applicant',
        role: 'applicant',
        action: 'Create',
        module: 'Applications',
        description: `Created application ${app.application_id}`,
        ip_address: '127.0.0.1',
        source: 'backend',
      });
      return { success: true, data: app };
    }
    // Otherwise use full create
    const app = this.applicationsService.create(body as CreateApplicationDto);
    this.auditLogsService.log({
      user_name: (app as any).full_name || 'Applicant',
      role: 'applicant',
      action: 'Create',
      module: 'Applications',
      description: `Created application ${app.application_id}`,
      ip_address: '127.0.0.1',
      source: 'backend',
    });
    return { success: true, data: app };
  }

  @Get('submitted')
  @Roles(Role.SUPER_USER)
  @ApiRoute({
    summary: 'List submitted paid applications',
    roles: [Role.SUPER_USER],
    responseDescription: 'Submitted applications with paymentDone set to true.',
    wrappedResponse: true,
    responseExample: [{ application_id: 1, application_status: 'submitted', paymentDone: true }],
  })
  findSubmitted() {
    return {
      success: true,
      data: this.applicationsService.findSubmitted(),
    };
  }

  @Patch(':id/assign')
  @Roles(Role.SUPER_USER)
  @ApiRoute({
    summary: 'Assign an application to a field officer',
    description: 'When officerId is omitted, the application is assigned to the least-loaded officer.',
    roles: [Role.SUPER_USER],
    params: [{ name: 'id', description: 'Application ID' }],
    bodySchema: {
      type: 'object',
      properties: {
        officerId: { type: 'number', example: 2, nullable: true },
      },
    },
    responseDescription: 'Assigned application.',
    wrappedResponse: true,
    responseExample: { application_id: 1, assignedOfficerId: 2, application_status: 'assigned' },
  })
  assign(
    @Param('id', ParseIntPipe) id: number,
    @Body('officerId') officerId?: number
  ) {
    const app = this.applicationsService.assignToOfficer(id, officerId ? Number(officerId) : undefined);
    this.auditLogsService.log({
      user_name: 'Super User',
      role: 'superuser',
      action: 'Update',
      module: 'Applications',
      description: `Assigned application ${id} to officer ${app.assignedOfficerId}`,
      ip_address: '127.0.0.1',
      source: 'backend',
    });
    return {
      success: true,
      data: app,
    };
  }

  @Get('officer/:officerId')
  @Roles(Role.FIELD_OFFICER, Role.SUPER_USER)
  @ApiRoute({
    summary: 'List applications assigned to an officer',
    roles: [Role.FIELD_OFFICER, Role.SUPER_USER],
    params: [{ name: 'officerId', description: 'Field officer user ID' }],
    wrappedResponse: true,
    responseExample: [{ application_id: 1, assignedOfficerId: 2 }],
  })
  findByOfficer(@Param('officerId', ParseIntPipe) officerId: number) {
    return {
      success: true,
      data: this.applicationsService.findByOfficer(officerId),
    };
  }

  @Patch(':id/verify')
  @Roles(Role.FIELD_OFFICER)
  @ApiRoute({
    summary: 'Mark an assigned application as verified',
    roles: [Role.FIELD_OFFICER],
    params: [{ name: 'id', description: 'Application ID' }],
    wrappedResponse: true,
    responseExample: { application_id: 1, application_status: 'verified' },
  })
  verify(@Param('id', ParseIntPipe) id: number) {
    const app = this.applicationsService.verify(id);
    this.auditLogsService.log({
      user_name: 'Field Officer',
      role: 'field_officer',
      action: 'Update',
      module: 'Applications',
      description: `Verified application ${id}`,
      ip_address: '127.0.0.1',
      source: 'backend',
    });
    return {
      success: true,
      data: app,
    };
  }

  // ── EXISTING ENDPOINTS ───────────────────────────────────────────────

  @Get()
  @Roles(Role.DEPARTMENT_OFFICER, Role.FIELD_OFFICER, Role.SUPER_USER)
  @ApiRoute({
    summary: 'List all applications',
    roles: [Role.DEPARTMENT_OFFICER, Role.FIELD_OFFICER, Role.SUPER_USER],
    wrappedResponse: true,
    responseExample: [{ application_id: 1, business_name: 'Registered Business Name' }],
  })
  findAll() {
    return { success: true, data: this.applicationsService.findAll() };
  }

  @Get('applicant/:applicantId')
  @Roles(Role.APPLICANT, Role.DEPARTMENT_OFFICER, Role.FIELD_OFFICER)
  @ApiRoute({
    summary: 'List applications for an applicant',
    roles: [Role.APPLICANT, Role.DEPARTMENT_OFFICER, Role.FIELD_OFFICER],
    params: [{ name: 'applicantId', description: 'Applicant user ID' }],
    wrappedResponse: true,
    responseExample: [{ application_id: 1, applicant_id: 3 }],
  })
  findByApplicant(@Param('applicantId', ParseIntPipe) applicantId: number) {
    return { success: true, data: this.applicationsService.findByApplicant(applicantId) };
  }

  @Get(':id')
  @Roles(Role.APPLICANT, Role.DEPARTMENT_OFFICER, Role.FIELD_OFFICER, Role.SUPER_USER)
  @ApiRoute({
    summary: 'Get application by ID',
    roles: [Role.APPLICANT, Role.DEPARTMENT_OFFICER, Role.FIELD_OFFICER, Role.SUPER_USER],
    params: [{ name: 'id', description: 'Application ID' }],
    wrappedResponse: true,
    responseExample: { application_id: 1, business_name: 'Registered Business Name' },
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return { success: true, data: this.applicationsService.findOne(id) };
  }

  @Patch(':id')
  @Roles(Role.DEPARTMENT_OFFICER, Role.FIELD_OFFICER, Role.APPLICANT)
  @ApiRoute({
    summary: 'Update application by ID',
    roles: [Role.DEPARTMENT_OFFICER, Role.FIELD_OFFICER, Role.APPLICANT],
    params: [{ name: 'id', description: 'Application ID' }],
    bodyType: UpdateApplicationDto,
    wrappedResponse: true,
    responseExample: { application_id: 1, application_status: 'assigned' },
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateApplicationDto: UpdateApplicationDto,
  ) {
    const app = this.applicationsService.update(id, updateApplicationDto);
    this.auditLogsService.log({
      user_name: 'System User',
      role: 'system',
      action: 'Update',
      module: 'Applications',
      description: `Updated application ${id}`,
      ip_address: '127.0.0.1',
      source: 'backend',
    });
    return { success: true, data: app };
  }

  @Delete(':id')
  @Roles(Role.DEPARTMENT_OFFICER)
  @ApiRoute({
    summary: 'Delete application by ID',
    roles: [Role.DEPARTMENT_OFFICER],
    params: [{ name: 'id', description: 'Application ID' }],
    wrappedResponse: true,
    responseExample: null,
  })
  remove(@Param('id', ParseIntPipe) id: number) {
    this.applicationsService.remove(id);
    this.auditLogsService.log({
      user_name: 'Department Officer',
      role: 'department_officer',
      action: 'Delete',
      module: 'Applications',
      description: `Deleted application ${id}`,
      ip_address: '127.0.0.1',
      source: 'backend',
    });
    return { success: true, data: null };
  }
}
