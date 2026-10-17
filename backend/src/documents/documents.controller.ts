import {
  BadRequestException,
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
  Patch,
  UploadedFile,
  UseInterceptors,
  Req,
  ForbiddenException,
  NotFoundException,
  StreamableFile,
  Header,
} from '@nestjs/common';
import { Request } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { randomUUID } from 'node:crypto';
import { createReadStream, existsSync, mkdirSync, statSync } from 'node:fs';
import { basename, extname } from 'node:path';
import { diskStorage } from 'multer';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentStatusDto } from './dto/update-document-status.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Role } from '../common/enums/role.enum';
import { DocumentType } from '../common/enums/document-type.enum';
import { VerificationStatus } from '../common/enums/verification-status.enum';
import { ApiRoute } from '../common/swagger/api-route.decorator';
import { documentUploadDirectory, resolveStoredDocumentPath } from './document-storage';
import { DocumentUploadCleanupInterceptor } from './document-upload-cleanup.interceptor';
import { ApplicationsService } from '../applications/applications.service';
import { AuthenticatedUser } from '../auth/auth-session.interface';

const maximumFileSize = 5 * 1024 * 1024;
const allowedFileTypes: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.pdf': 'application/pdf',
};

mkdirSync(documentUploadDirectory, { recursive: true });

@ApiTags('Documents')
@Controller('documents')
@UseGuards(RolesGuard)
export class DocumentsController {
  constructor(
    private readonly documentsService: DocumentsService,
    private readonly applicationsService: ApplicationsService,
  ) {}

  @Post()
  @Roles(Role.APPLICANT, Role.DEPARTMENT_OFFICER)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Document metadata and the file to upload.',
    schema: {
      type: 'object',
      required: ['application_id', 'document_type', 'file'],
      properties: {
        application_id: { type: 'number', example: 1 },
        document_type: {
          enum: Object.values(DocumentType),
          example: DocumentType.AADHAR_CARD,
        },
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  // Decorator metadata is applied bottom-up. Keep cleanup above Multer so it
  // executes after Multer has assigned request.file and before the handler.
  @UseInterceptors(DocumentUploadCleanupInterceptor)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: documentUploadDirectory,
        filename: (_request, file, callback) => {
          callback(null, `${randomUUID()}${extname(file.originalname).toLowerCase()}`);
        },
      }),
      limits: { fileSize: maximumFileSize },
      fileFilter: (_request, file, callback) => {
        const extension = extname(file.originalname).toLowerCase();
        if (allowedFileTypes[extension] !== file.mimetype) {
          callback(
            new BadRequestException('Only JPG, JPEG, PNG, and PDF files are allowed'),
            false,
          );
          return;
        }

        callback(null, true);
      },
    }),
  )
  @ApiRoute({
    summary: 'Create uploaded document record',
    roles: [Role.APPLICANT, Role.DEPARTMENT_OFFICER],
    status: 201,
    responseExample: { document_id: 1, application_id: 1, verification_status: 'pending' },
  })
  create(
    @Body() createDocumentDto: CreateDocumentDto,
    @UploadedFile() file?: Express.Multer.File,
    @Req() request?: Request & { user: AuthenticatedUser },
  ) {
    if (!file) {
      throw new BadRequestException('A document file is required');
    }
    if (!request?.user) {
      throw new ForbiddenException('Authentication is required to upload documents');
    }
    const application = this.applicationsService.findOne(createDocumentDto.application_id);
    this.assertApplicationAccess(application, request.user);

    return this.documentsService.create(
      createDocumentDto,
      `uploads/documents/${file.filename}`,
      basename(file.originalname.replace(/\\/g, '/')).replace(/[\r\n"]/g, '_'),
      file.mimetype,
    );
  }

  @Get()
  @Roles(Role.DEPARTMENT_OFFICER, Role.FIELD_OFFICER, Role.SUPER_USER, Role.PLATFORM_ADMIN)
  @ApiRoute({
    summary: 'List documents',
    roles: [Role.DEPARTMENT_OFFICER, Role.FIELD_OFFICER, Role.SUPER_USER, Role.PLATFORM_ADMIN],
    responseExample: [{ document_id: 1, application_id: 1 }],
  })
  findAll(@Req() request: Request & { user: AuthenticatedUser }) {
    if (request.user.role === Role.PLATFORM_ADMIN) {
      return this.documentsService.findAll();
    }
    const userMuni = request.user.municipalityId;
    if (!userMuni) return [];
    const appsInMuni = new Set(this.applicationsService.findAll(userMuni)
      .filter((application) => request.user.role !== Role.FIELD_OFFICER ||
        application.assignedOfficerId === request.user.userId)
      .map((application) => application.application_id));
    return this.documentsService.findAll().filter((d) => appsInMuni.has(d.application_id));
  }

  @Get('application/:applicationId')
  @Roles(Role.APPLICANT, Role.DEPARTMENT_OFFICER, Role.FIELD_OFFICER, Role.SUPER_USER, Role.PLATFORM_ADMIN)
  @ApiRoute({
    summary: 'List documents by application',
    roles: [Role.APPLICANT, Role.DEPARTMENT_OFFICER, Role.FIELD_OFFICER, Role.SUPER_USER, Role.PLATFORM_ADMIN],
    params: [{ name: 'applicationId', description: 'Application ID' }],
    responseExample: [{ document_id: 1, application_id: 1 }],
  })
  findByApplication(
    @Param('applicationId', ParseIntPipe) applicationId: number,
    @Req() request: Request & { user: AuthenticatedUser },
  ) {
    const app = this.applicationsService.findOne(applicationId);
    this.assertApplicationAccess(app, request.user);
    return this.documentsService.findByApplication(applicationId);
  }

  @Get(':id')
  @Roles(Role.APPLICANT, Role.DEPARTMENT_OFFICER, Role.FIELD_OFFICER, Role.SUPER_USER, Role.PLATFORM_ADMIN)
  @ApiRoute({
    summary: 'Get document by ID',
    roles: [Role.APPLICANT, Role.DEPARTMENT_OFFICER, Role.FIELD_OFFICER, Role.SUPER_USER, Role.PLATFORM_ADMIN],
    params: [{ name: 'id', description: 'Document ID' }],
    responseExample: { document_id: 1, verification_status: 'pending' },
  })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: Request & { user: AuthenticatedUser },
  ) {
    const doc = this.documentsService.findOne(id);
    const app = this.applicationsService.findOne(doc.application_id);
    this.assertApplicationAccess(app, request.user);
    return doc;
  }

  @Get(':id/file')
  @Roles(Role.APPLICANT, Role.DEPARTMENT_OFFICER, Role.FIELD_OFFICER, Role.SUPER_USER, Role.PLATFORM_ADMIN)
  @Header('Cache-Control', 'private, no-store')
  @Header('X-Content-Type-Options', 'nosniff')
  @ApiRoute({
    summary: 'View an uploaded document',
    roles: [Role.APPLICANT, Role.DEPARTMENT_OFFICER, Role.FIELD_OFFICER, Role.SUPER_USER, Role.PLATFORM_ADMIN],
    params: [{ name: 'id', description: 'Document ID' }],
    responseDescription: 'The authorized document file.',
  })
  viewFile(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: Request & { user: AuthenticatedUser },
  ): StreamableFile {
    return this.streamFile(id, request.user, 'inline');
  }

  @Get(':id/download')
  @Roles(Role.APPLICANT, Role.DEPARTMENT_OFFICER, Role.FIELD_OFFICER, Role.SUPER_USER, Role.PLATFORM_ADMIN)
  @Header('Cache-Control', 'private, no-store')
  @Header('X-Content-Type-Options', 'nosniff')
  @ApiRoute({
    summary: 'Download an uploaded document',
    roles: [Role.APPLICANT, Role.DEPARTMENT_OFFICER, Role.FIELD_OFFICER, Role.SUPER_USER, Role.PLATFORM_ADMIN],
    params: [{ name: 'id', description: 'Document ID' }],
    responseDescription: 'The authorized document file as an attachment.',
  })
  downloadFile(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: Request & { user: AuthenticatedUser },
  ): StreamableFile {
    return this.streamFile(id, request.user, 'attachment');
  }

  @Patch(':id/status')
  @Roles(Role.DEPARTMENT_OFFICER)
  @ApiRoute({
    summary: 'Update document verification status',
    roles: [Role.DEPARTMENT_OFFICER],
    params: [{ name: 'id', description: 'Document ID' }],
    bodyType: UpdateDocumentStatusDto,
    responseExample: { document_id: 1, verification_status: 'rejected', rejection_reason: 'Document is unclear' },
  })
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateDocumentStatusDto,
    @Req() request: Request & { user: AuthenticatedUser },
  ) {
    if (request.user.role !== Role.DEPARTMENT_OFFICER) {
      throw new ForbiddenException('Only Department Officers can update document verification status');
    }
    const document = this.documentsService.findOne(id);
    const application = this.applicationsService.findOne(document.application_id);
    this.assertApplicationAccess(application, request.user);
    return this.documentsService.updateVerificationStatus(
      id,
      updateDto.status,
      updateDto.rejection_reason,
    );
  }

  @Delete(':id')
  @Roles(Role.DEPARTMENT_OFFICER, Role.APPLICANT)
  @ApiRoute({
    summary: 'Delete document by ID',
    roles: [Role.DEPARTMENT_OFFICER, Role.APPLICANT],
    params: [{ name: 'id', description: 'Document ID' }],
    responseExample: true,
  })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: Request & { user: AuthenticatedUser },
  ) {
    const document = this.documentsService.findOne(id);
    const application = this.applicationsService.findOne(document.application_id);
    this.assertApplicationAccess(application, request.user);
    return this.documentsService.remove(id);
  }

  private streamFile(
    id: number,
    user: AuthenticatedUser,
    disposition: 'inline' | 'attachment',
  ): StreamableFile {
    const document = this.documentsService.findOne(id);
    const application = this.applicationsService.findOne(document.application_id);
    this.assertApplicationAccess(application, user);

    const filePath = resolveStoredDocumentPath(document.file_path);
    if (!existsSync(filePath) || !statSync(filePath).isFile()) {
      throw new NotFoundException('The uploaded document file is no longer available');
    }

    const mimeType = allowedFileTypes[extname(filePath).toLowerCase()];
    if (!mimeType || (document.mime_type && document.mime_type !== mimeType)) {
      throw new BadRequestException('The stored document type is invalid');
    }
    const filename = basename((document.original_filename || basename(filePath)).replace(/\\/g, '/'))
      .replace(/[\r\n"]/g, '_');
    const fallbackFilename = basename(filename).replace(/[^\w.-]/g, '_') || 'document';
    const encodedFilename = encodeURIComponent(filename).replace(/['()*]/g, (character) =>
      `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
    );
    const contentDisposition = `${disposition}; filename="${fallbackFilename}"; filename*=UTF-8''${encodedFilename}`;

    return new StreamableFile(createReadStream(filePath), {
      type: mimeType,
      disposition: contentDisposition,
    });
  }

  private assertApplicationAccess(
    application: ReturnType<ApplicationsService['findOne']>,
    user: AuthenticatedUser,
  ): void {
    if (user.role === Role.PLATFORM_ADMIN) return;

    if (user.role === Role.APPLICANT) {
      if (application.applicant_id !== user.userId) {
        throw new ForbiddenException('Access denied to this application document');
      }
      return;
    }

    const userMuni = user.municipalityId;
    if (!userMuni || (application.municipality_id || '').toLowerCase() !== userMuni.toLowerCase()) {
      throw new ForbiddenException('Access denied to documents outside your municipality');
    }
    if (user.role === Role.FIELD_OFFICER && application.assignedOfficerId !== user.userId) {
      throw new ForbiddenException('You are not assigned to access this application document');
    }
  }
}
