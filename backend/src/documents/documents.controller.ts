import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
  Patch,
} from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Role } from '../common/enums/role.enum';
import { VerificationStatus } from '../common/enums/verification-status.enum';
import { ApiTags } from '@nestjs/swagger';
import { ApiRoute } from '../common/swagger/api-route.decorator';

@ApiTags('Documents')
@Controller('documents')
@UseGuards(RolesGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post()
  @Roles(Role.APPLICANT, Role.DEPARTMENT_OFFICER)
  @ApiRoute({
    summary: 'Create uploaded document record',
    roles: [Role.APPLICANT, Role.DEPARTMENT_OFFICER],
    bodyType: CreateDocumentDto,
    status: 201,
    responseExample: { document_id: 1, application_id: 1, verification_status: 'pending' },
  })
  create(@Body() createDocumentDto: CreateDocumentDto) {
    return this.documentsService.create(createDocumentDto);
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
