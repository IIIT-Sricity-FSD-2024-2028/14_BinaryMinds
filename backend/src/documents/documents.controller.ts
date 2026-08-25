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
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { randomUUID } from 'node:crypto';
import { mkdirSync, unlinkSync } from 'node:fs';
import { extname, resolve } from 'node:path';
import { diskStorage } from 'multer';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Role } from '../common/enums/role.enum';
import { DocumentType } from '../common/enums/document-type.enum';
import { VerificationStatus } from '../common/enums/verification-status.enum';
import { ApiRoute } from '../common/swagger/api-route.decorator';

const uploadDirectory = resolve(__dirname, '..', '..', 'uploads', 'documents');
const maximumFileSize = 5 * 1024 * 1024;
const allowedFileTypes: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.pdf': 'application/pdf',
};

mkdirSync(uploadDirectory, { recursive: true });

@ApiTags('Documents')
@Controller('documents')
@UseGuards(RolesGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

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
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: uploadDirectory,
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
  ) {
    if (!file) {
      throw new BadRequestException('A document file is required');
    }

    try {
      return this.documentsService.create(
        createDocumentDto,
        `uploads/documents/${file.filename}`,
      );
    } catch (error) {
      unlinkSync(file.path);
      throw error;
    }
  }

  @Get()
  @Roles(Role.DEPARTMENT_OFFICER, Role.FIELD_OFFICER)
  @ApiRoute({
    summary: 'List documents',
    roles: [Role.DEPARTMENT_OFFICER, Role.FIELD_OFFICER],
    responseExample: [{ document_id: 1, application_id: 1 }],
  })
  findAll() {
    return this.documentsService.findAll();
  }

  @Get('application/:applicationId')
  @Roles(Role.APPLICANT, Role.DEPARTMENT_OFFICER, Role.FIELD_OFFICER)
  @ApiRoute({
    summary: 'List documents by application',
    roles: [Role.APPLICANT, Role.DEPARTMENT_OFFICER, Role.FIELD_OFFICER],
    params: [{ name: 'applicationId', description: 'Application ID' }],
    responseExample: [{ document_id: 1, application_id: 1 }],
  })
  findByApplication(
    @Param('applicationId', ParseIntPipe) applicationId: number,
  ) {
    return this.documentsService.findByApplication(applicationId);
  }

  @Get(':id')
  @Roles(Role.APPLICANT, Role.DEPARTMENT_OFFICER, Role.FIELD_OFFICER)
  @ApiRoute({
    summary: 'Get document by ID',
    roles: [Role.APPLICANT, Role.DEPARTMENT_OFFICER, Role.FIELD_OFFICER],
    params: [{ name: 'id', description: 'Document ID' }],
    responseExample: { document_id: 1, verification_status: 'pending' },
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.documentsService.findOne(id);
  }

  @Patch(':id/status')
  @Roles(Role.DEPARTMENT_OFFICER, Role.FIELD_OFFICER)
  @ApiRoute({
    summary: 'Update document verification status',
    roles: [Role.DEPARTMENT_OFFICER, Role.FIELD_OFFICER],
    params: [{ name: 'id', description: 'Document ID' }],
    bodySchema: {
      type: 'object',
      required: ['status'],
      properties: {
        status: { enum: Object.values(VerificationStatus), example: VerificationStatus.VERIFIED },
      },
    },
    responseExample: { document_id: 1, verification_status: 'verified' },
  })
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: VerificationStatus,
  ) {
    return this.documentsService.updateVerificationStatus(id, status);
  }

  @Delete(':id')
  @Roles(Role.DEPARTMENT_OFFICER, Role.APPLICANT)
  @ApiRoute({
    summary: 'Delete document by ID',
    roles: [Role.DEPARTMENT_OFFICER, Role.APPLICANT],
    params: [{ name: 'id', description: 'Document ID' }],
    responseExample: true,
  })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.documentsService.remove(id);
  }
}
