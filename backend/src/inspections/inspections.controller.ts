import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ConflictException,
  ForbiddenException,
  BadRequestException,
  NotFoundException,
  StreamableFile,
  Header,
  UploadedFiles,
  UseInterceptors,
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
import { InspectionStatus } from '../common/enums/inspection-status.enum';

import { ApplicationsService } from '../applications/applications.service';
import { UsersService } from '../users/users.service';
import { ApplicationStatus } from '../common/enums/application-status.enum';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { randomUUID } from 'crypto';
import { createReadStream, existsSync, mkdirSync, statSync } from 'fs';
import { basename, extname } from 'path';
import { ApiConsumes } from '@nestjs/swagger';
import { documentUploadDirectory, assertValidDocumentSignature, resolveStoredDocumentPath } from '../documents/document-storage';
import { InspectionEvidenceCleanupInterceptor } from './inspection-evidence-cleanup.interceptor';
import { InspectionEvidenceFile } from './inspection.interface';

mkdirSync(documentUploadDirectory, { recursive: true });
const evidenceMimeByExtension: Record<string, string> = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png' };
const safeEvidenceName = (name: string) => basename(name).replace(/[\r\n"\\]/g, '_');

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
    const assignment = this.service.findAssignment(createDto.assignment_id);
    const application = this.applicationsService.findOne(assignment.application_id);
    if (Number(createDto.field_officer_id) !== Number(assignment.field_officer_id)) {
      throw new ForbiddenException('Inspection officer must match the application assignment');
    }
    if (
      application.assignedOfficerId === null ||
      application.assignedOfficerId === undefined ||
      Number(application.assignedOfficerId) !== Number(assignment.field_officer_id)
    ) {
      throw new ForbiddenException('The application is no longer assigned to this Field Officer');
    }
    if (
      application.application_status !== ApplicationStatus.VERIFIED &&
      application.application_status !== ApplicationStatus.DOCUMENTS_UPLOADED &&
      application.application_status !== ApplicationStatus.INSPECTION_SCHEDULED
    ) {
      throw new BadRequestException('The application must be verified before an inspection can be scheduled');
    }
    if (request.user.role !== Role.PLATFORM_ADMIN) {
      const userMuni = request.user.municipalityId;
      if (!userMuni || (application.municipality_id || '').toLowerCase() !== userMuni.toLowerCase()) {
        throw new ForbiddenException('You cannot schedule inspections outside your municipality');
      }
    }
    if (request.user.role === Role.FIELD_OFFICER) {
      if (Number(assignment.field_officer_id) !== Number(request.user.userId)) {
        throw new ForbiddenException('You cannot schedule an inspection for another Field Officer');
      }
    }

    if (createDto.scheduled_date) {
      const requestedTime = new Date(createDto.scheduled_date).getTime();
      const duplicate = Number.isFinite(requestedTime) && this.service
        .findByApplication(application.application_id)
        .some((existing) =>
          existing.scheduled_date &&
          new Date(existing.scheduled_date).getTime() === requestedTime,
        );
      if (duplicate) {
        throw new ConflictException('An inspection is already recorded for this application at that date and time.');
      }
    }

    const inspection = this.service.create(createDto);
    if (application.application_status !== ApplicationStatus.INSPECTION_SCHEDULED) {
      this.applicationsService.update(application.application_id, {
        application_status: ApplicationStatus.INSPECTION_SCHEDULED,
      });
    }
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
  findByAssignment(
    @Param('assignmentId', ParseIntPipe) assignmentId: number,
    @Req() request: Request & { user: AuthenticatedUser },
  ) {
    const assignment = this.service.findAssignment(assignmentId);
    const application = this.applicationsService.findOne(assignment.application_id);
    if (request.user.role !== Role.PLATFORM_ADMIN) {
      const userMuni = request.user.municipalityId;
      if (!userMuni || (application.municipality_id || '').toLowerCase() !== userMuni.toLowerCase()) {
        throw new ForbiddenException('Access denied to inspections outside your municipality');
      }
    }
    if (request.user.role === Role.FIELD_OFFICER) {
      if (Number(assignment.field_officer_id) !== Number(request.user.userId)) {
        throw new ForbiddenException('Field Officers can only view inspections for their own assignments');
      }
    }
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

  @Get(':id/evidence/:filename')
  @Roles(Role.DEPARTMENT_OFFICER, Role.FIELD_OFFICER, Role.SUPER_USER, Role.PLATFORM_ADMIN)
  @Header('Cache-Control', 'private, no-store')
  @Header('X-Content-Type-Options', 'nosniff')
  async getEvidence(
    @Param('id', ParseIntPipe) id: number,
    @Param('filename') filename: string,
    @Req() request: Request & { user: AuthenticatedUser },
  ): Promise<StreamableFile> {
    const inspection = this.service.findOne(id);
    const assignment = this.service.findAssignment(inspection.assignment_id);
    const application = this.applicationsService.findOne(assignment.application_id);
    if (request.user.role !== Role.PLATFORM_ADMIN) {
      if (!request.user.municipalityId || (application.municipality_id || '').toLowerCase() !== request.user.municipalityId.toLowerCase()) {
        throw new ForbiddenException('You cannot view inspection evidence outside your municipality');
      }
    }
    if (request.user.role === Role.FIELD_OFFICER && Number(assignment.field_officer_id) !== Number(request.user.userId)) {
      throw new ForbiddenException('Field Officers can only view evidence for their own assignments');
    }
    const evidence = (inspection.evidence_files || []).find((file) => file.filename === filename);
    if (!evidence) throw new NotFoundException('Inspection evidence was not found');
    const filePath = resolveStoredDocumentPath(evidence.filename);
    if (!existsSync(filePath) || !statSync(filePath).isFile()) throw new NotFoundException('Inspection evidence file is unavailable');
    const mime = evidenceMimeByExtension[extname(evidence.filename).toLowerCase()];
    if (!mime || evidence.mime_type !== mime) throw new NotFoundException('Inspection evidence file is unavailable');
    return new StreamableFile(createReadStream(filePath), {
      type: mime,
      disposition: `inline; filename="${safeEvidenceName(evidence.original_filename)}"`,
    });
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
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(InspectionEvidenceCleanupInterceptor)
  @UseInterceptors(FilesInterceptor('evidence', 10, {
    storage: diskStorage({
      destination: documentUploadDirectory,
      filename: (_request, file, callback) => callback(null, `${randomUUID()}${extname(file.originalname).toLowerCase()}`),
    }),
    limits: { fileSize: 5 * 1024 * 1024, files: 10 },
    fileFilter: (_request, file, callback) => {
      const extension = extname(file.originalname).toLowerCase();
      if (!evidenceMimeByExtension[extension] || file.mimetype !== evidenceMimeByExtension[extension]) {
        return callback(new BadRequestException('Only JPG and PNG evidence files are allowed.'), false);
      }
      callback(null, true);
    },
  }))
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
    @UploadedFiles() files: Express.Multer.File[],
    @Req() request: Request & { user: AuthenticatedUser },
  ) {
    const existing = this.service.findOne(id);
    const assignment = this.service.findAssignment(existing.assignment_id);
    const application = this.applicationsService.findOne(assignment.application_id);

    if (request.user.role !== Role.PLATFORM_ADMIN) {
      if (
        !request.user.municipalityId ||
        (application.municipality_id || '').toLowerCase() !== request.user.municipalityId.toLowerCase()
      ) {
        throw new ForbiddenException('You cannot submit inspection reports outside your municipality');
      }
    }
    if (
      request.user.role === Role.FIELD_OFFICER &&
      Number(assignment.field_officer_id) !== Number(request.user.userId)
    ) {
      throw new ForbiddenException('Field Officers can submit reports only for their own assignments');
    }

    const uploadedFiles = files || [];
    const evidenceFiles: InspectionEvidenceFile[] = uploadedFiles.map((file) => ({
      filename: file.filename,
      original_filename: safeEvidenceName(file.originalname),
      mime_type: file.mimetype,
      uploaded_at: new Date(),
    }));
    for (const file of uploadedFiles) assertValidDocumentSignature(file);
    const inspection = this.service.submitReport(id, reportDto, evidenceFiles);
    (request as Request & { inspectionEvidencePersisted?: boolean }).inspectionEvidencePersisted = true;
    if (
      reportDto.status === InspectionStatus.COMPLETED ||
      reportDto.status === InspectionStatus.FAILED
    ) {
      this.applicationsService.update(application.application_id, {
        application_status: ApplicationStatus.INSPECTION_COMPLETED,
      });
    }
    this.auditLogsService.log({
      user_name: request.user.fullName || 'Field Officer',
      role: String(request.user.role),
      action: 'Submit',
      module: 'Inspections',
      description: `Submitted inspection report ${inspection.inspection_id}`,
      ip_address: '127.0.0.1',
      source: 'backend',
    });
    return inspection;
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
