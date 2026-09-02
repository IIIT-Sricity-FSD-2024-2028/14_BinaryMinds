import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ForbiddenException,
  BadRequestException,
  ParseIntPipe,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { ApplicationsService } from './applications.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { CreateSimpleApplicationDto } from './dto/create-simple-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { AssignOfficerDto } from './dto/assign-officer.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Role } from '../common/enums/role.enum';
import { ApiExtraModels, ApiTags } from '@nestjs/swagger';
import { ApiRoute } from '../common/swagger/api-route.decorator';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { AuthenticatedUser } from '../auth/auth-session.interface';
import { UsersService } from '../users/users.service';

@ApiTags('Applications')
@ApiExtraModels(CreateApplicationDto, CreateSimpleApplicationDto, AssignOfficerDto)
@Controller('applications')
@UseGuards(RolesGuard)
export class ApplicationsController {
  constructor(
    private readonly applicationsService: ApplicationsService,
    private readonly auditLogsService: AuditLogsService,
    private readonly usersService: UsersService,
  ) {}

  // ── NEW WORKFLOW ENDPOINTS ───────────────────────────────────────────

  @Post()
  @Roles(Role.APPLICANT, Role.DEPARTMENT_OFFICER, Role.SUPER_USER, Role.PLATFORM_ADMIN)
  @ApiRoute({
    summary: 'Create a new application',
    description: 'Accepts either the full application payload or the simplified applicant workflow payload.',
    roles: [Role.APPLICANT, Role.DEPARTMENT_OFFICER, Role.SUPER_USER, Role.PLATFORM_ADMIN],
    bodyTypes: [CreateApplicationDto, CreateSimpleApplicationDto],
    status: 201,
    responseDescription: 'Application created.',
    wrappedResponse: true,
    responseExample: { application_id: 1, application_status: 'submitted' },
    notFound: true,
  })
  create(
    @Body() body: CreateApplicationDto,
    @Req() request: Request & { user: AuthenticatedUser },
  ) {
    const applicantId = body.applicant_id || request.user.userId;
    const applicantName = body.applicantName || body.full_name || 'Applicant';
    const bizName = body.businessName || body.business_name || 'N/A';
    const cat = body.tradeCategory || body.trade_category || 'General';
    const shopAddr = body.shopAddress || body.shop_address || '';
    const phone = body.phone || body.applicant_phone || '';
    const city = body.city || body.district;
    const district = body.district;
    const state = body.state;
    const pincode = body.pincode;
    const targetMuni = body.municipalityId || body.municipality_id;

    const app = this.applicationsService.createSimple(
      {
        applicantName,
        businessName: bizName,
        businessType: body.businessType || body.business_type,
        tradeCategory: cat,
        shopAddress: shopAddr,
        city,
        district,
        state,
        pincode,
        phone,
        municipality_id: targetMuni,
      },
      applicantId,
    );

    this.auditLogsService.log({
      user_name: applicantName,
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
  @Roles(Role.SUPER_USER, Role.PLATFORM_ADMIN)
  @ApiRoute({
    summary: 'List submitted paid applications',
    roles: [Role.SUPER_USER, Role.PLATFORM_ADMIN],
    responseDescription: 'Submitted applications with paymentDone set to true.',
    wrappedResponse: true,
    responseExample: [{ application_id: 1, application_status: 'submitted', paymentDone: true }],
  })
  findSubmitted(@Req() request: Request & { user: AuthenticatedUser }) {
    const muniId =
      request.user.role === Role.PLATFORM_ADMIN
        ? undefined
        : request.user.municipalityId;
    return {
      success: true,
      data: this.applicationsService.findSubmitted(muniId),
    };
  }

  @Patch(':id/assign')
  @Roles(Role.SUPER_USER, Role.PLATFORM_ADMIN)
  @ApiRoute({
    summary: 'Assign an application to a field officer',
    description: 'When officerId is omitted, the application is assigned to the least-loaded officer.',
    roles: [Role.SUPER_USER, Role.PLATFORM_ADMIN],
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
    @Body() dto: AssignOfficerDto,
    @Req() request: Request & { user: AuthenticatedUser },
  ) {
    const officerId = dto?.officerId;
    const existing = this.applicationsService.findOne(id);

    if (request?.user?.role !== Role.PLATFORM_ADMIN) {
      const userMuni = request?.user?.municipalityId;
      if (!userMuni || (existing.municipality_id || '').toLowerCase() !== userMuni.toLowerCase()) {
        throw new ForbiddenException('You cannot assign applications outside your municipality');
      }
    }

    if (officerId) {
      const targetOfficer = this.usersService.findOne(Number(officerId));
      if (
        (targetOfficer.municipality_id || '').toLowerCase() !==
        (existing.municipality_id || '').toLowerCase()
      ) {
        throw new BadRequestException('Cannot assign an officer from a different municipality');
      }
    }

    const app = this.applicationsService.assignToOfficer(id, officerId ? Number(officerId) : undefined);
    this.auditLogsService.log({
      user_name: request?.user?.fullName || 'Super User',
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
  @Roles(Role.FIELD_OFFICER, Role.SUPER_USER, Role.PLATFORM_ADMIN)
  @ApiRoute({
    summary: 'List applications assigned to an officer',
    roles: [Role.FIELD_OFFICER, Role.SUPER_USER, Role.PLATFORM_ADMIN],
    params: [{ name: 'officerId', description: 'Field officer user ID' }],
    wrappedResponse: true,
    responseExample: [{ application_id: 1, assignedOfficerId: 2 }],
  })
  findByOfficer(
    @Param('officerId', ParseIntPipe) officerId: number,
    @Req() request: Request & { user: AuthenticatedUser },
  ) {
    if (request.user.role === Role.FIELD_OFFICER && request.user.userId !== officerId) {
      throw new ForbiddenException('Field officers can only view their own assigned applications');
    }
    return {
      success: true,
      data: this.applicationsService.findByOfficer(officerId),
    };
  }

  @Patch(':id/verify')
  @Roles(Role.FIELD_OFFICER, Role.PLATFORM_ADMIN)
  @ApiRoute({
    summary: 'Mark an assigned application as verified',
    roles: [Role.FIELD_OFFICER, Role.PLATFORM_ADMIN],
    params: [{ name: 'id', description: 'Application ID' }],
    wrappedResponse: true,
    responseExample: { application_id: 1, application_status: 'verified' },
  })
  verify(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: Request & { user: AuthenticatedUser },
  ) {
    const existing = this.applicationsService.findOne(id);

    if (request.user.role !== Role.PLATFORM_ADMIN) {
      const userMuni = request.user.municipalityId;
      if (!userMuni || (existing.municipality_id || '').toLowerCase() !== userMuni.toLowerCase()) {
        throw new ForbiddenException('Access denied to verify applications outside your municipality');
      }
      if (existing.assignedOfficerId && existing.assignedOfficerId !== request.user.userId) {
        throw new ForbiddenException('You are not assigned to verify this application');
      }
    }

    const app = this.applicationsService.verify(id);
    this.auditLogsService.log({
      user_name: request.user.fullName || 'Field Officer',
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
  @Roles(Role.DEPARTMENT_OFFICER, Role.FIELD_OFFICER, Role.SUPER_USER, Role.PLATFORM_ADMIN)
  @ApiRoute({
    summary: 'List all applications',
    roles: [Role.DEPARTMENT_OFFICER, Role.FIELD_OFFICER, Role.SUPER_USER, Role.PLATFORM_ADMIN],
    wrappedResponse: true,
    responseExample: [{ application_id: 1, business_name: 'Registered Business Name' }],
  })
  findAll(@Req() request: Request & { user: AuthenticatedUser }) {
    const muniId =
      request.user.role === Role.PLATFORM_ADMIN
        ? undefined
        : request.user.municipalityId;
    return { success: true, data: this.applicationsService.findAll(muniId) };
  }

  @Get('applicant/:applicantId')
  @Roles(Role.APPLICANT, Role.DEPARTMENT_OFFICER, Role.FIELD_OFFICER, Role.SUPER_USER, Role.PLATFORM_ADMIN)
  @ApiRoute({
    summary: 'List applications for an applicant',
    roles: [Role.APPLICANT, Role.DEPARTMENT_OFFICER, Role.FIELD_OFFICER, Role.SUPER_USER, Role.PLATFORM_ADMIN],
    params: [{ name: 'applicantId', description: 'Applicant user ID' }],
    wrappedResponse: true,
    responseExample: [{ application_id: 1, applicant_id: 3 }],
  })
  findByApplicant(
    @Param('applicantId', ParseIntPipe) applicantId: number,
    @Req() request: Request & { user: AuthenticatedUser },
  ) {
    if (request.user.role === Role.APPLICANT && request.user.userId !== applicantId) {
      throw new ForbiddenException('Applicants can only view their own applications');
    }
    const apps = this.applicationsService.findByApplicant(applicantId);
    if (request.user.role !== Role.PLATFORM_ADMIN && request.user.role !== Role.APPLICANT) {
      const userMuni = request.user.municipalityId;
      return {
        success: true,
        data: apps.filter((a) => (a.municipality_id || '').toLowerCase() === (userMuni || '').toLowerCase()),
      };
    }
    return { success: true, data: apps };
  }

  @Get('mine')
  @Roles(Role.APPLICANT)
  @ApiRoute({
    summary: 'List applications for the authenticated applicant',
    roles: [Role.APPLICANT],
    wrappedResponse: true,
    responseExample: [{ application_id: 1, applicant_id: 3 }],
  })
  findMine(@Req() request: Request & { user: AuthenticatedUser }) {
    return {
      success: true,
      data: this.applicationsService.findByApplicant(request.user.userId),
    };
  }

  @Get(':id')
  @Roles(Role.APPLICANT, Role.DEPARTMENT_OFFICER, Role.FIELD_OFFICER, Role.SUPER_USER, Role.PLATFORM_ADMIN)
  @ApiRoute({
    summary: 'Get application by ID',
    roles: [Role.APPLICANT, Role.DEPARTMENT_OFFICER, Role.FIELD_OFFICER, Role.SUPER_USER, Role.PLATFORM_ADMIN],
    params: [{ name: 'id', description: 'Application ID' }],
    wrappedResponse: true,
    responseExample: { application_id: 1, business_name: 'Registered Business Name' },
  })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: Request & { user: AuthenticatedUser },
  ) {
    const app = this.applicationsService.findOne(id);
    if (request.user.role === Role.PLATFORM_ADMIN) {
      return { success: true, data: app };
    }
    if (request.user.role === Role.APPLICANT) {
      if (app.applicant_id !== request.user.userId) {
        throw new ForbiddenException('You can only view your own applications');
      }
      return { success: true, data: app };
    }
    const userMuni = request.user.municipalityId;
    if (!userMuni || (app.municipality_id || '').toLowerCase() !== userMuni.toLowerCase()) {
      throw new ForbiddenException('Access denied to applications outside your municipality');
    }
    return { success: true, data: app };
  }

  @Patch(':id')
  @Roles(Role.DEPARTMENT_OFFICER, Role.FIELD_OFFICER, Role.APPLICANT, Role.SUPER_USER, Role.PLATFORM_ADMIN)
  @ApiRoute({
    summary: 'Update application by ID',
    roles: [Role.DEPARTMENT_OFFICER, Role.FIELD_OFFICER, Role.APPLICANT, Role.SUPER_USER, Role.PLATFORM_ADMIN],
    params: [{ name: 'id', description: 'Application ID' }],
    bodyType: UpdateApplicationDto,
    wrappedResponse: true,
    responseExample: { application_id: 1, application_status: 'assigned' },
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateApplicationDto: UpdateApplicationDto,
    @Req() request: Request & { user: AuthenticatedUser },
  ) {
    const existing = this.applicationsService.findOne(id);
    if (request.user.role !== Role.PLATFORM_ADMIN) {
      if (request.user.role === Role.APPLICANT && existing.applicant_id !== request.user.userId) {
        throw new ForbiddenException('You can only update your own applications');
      }
      const userMuni = request.user.municipalityId;
      if (!userMuni || (existing.municipality_id || '').toLowerCase() !== userMuni.toLowerCase()) {
        throw new ForbiddenException('Access denied to modify applications outside your municipality');
      }
    }

    const app = this.applicationsService.update(id, updateApplicationDto);
    this.auditLogsService.log({
      user_name: request.user.fullName || 'System User',
      role: String(request.user.role),
      action: 'Update',
      module: 'Applications',
      description: `Updated application ${id}`,
      ip_address: '127.0.0.1',
      source: 'backend',
    });
    return { success: true, data: app };
  }

  @Delete(':id')
  @Roles(Role.DEPARTMENT_OFFICER, Role.SUPER_USER, Role.PLATFORM_ADMIN)
  @ApiRoute({
    summary: 'Delete application by ID',
    roles: [Role.DEPARTMENT_OFFICER, Role.SUPER_USER, Role.PLATFORM_ADMIN],
    params: [{ name: 'id', description: 'Application ID' }],
    wrappedResponse: true,
    responseExample: null,
  })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: Request & { user: AuthenticatedUser },
  ) {
    const existing = this.applicationsService.findOne(id);
    if (request.user.role !== Role.PLATFORM_ADMIN) {
      const userMuni = request.user.municipalityId;
      if (!userMuni || (existing.municipality_id || '').toLowerCase() !== userMuni.toLowerCase()) {
        throw new ForbiddenException('Access denied to delete applications outside your municipality');
      }
    }

    this.applicationsService.remove(id);
    this.auditLogsService.log({
      user_name: request.user.fullName || 'Department Officer',
      role: String(request.user.role),
      action: 'Delete',
      module: 'Applications',
      description: `Deleted application ${id}`,
      ip_address: '127.0.0.1',
      source: 'backend',
    });
    return { success: true, data: null };
  }
}

