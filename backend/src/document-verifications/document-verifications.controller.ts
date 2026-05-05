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
import { DocumentVerificationsService } from './document-verifications.service';
import { CreateDocumentVerificationDto } from './dto/create-document-verification.dto';
import { UpdateDocumentVerificationDto } from './dto/update-document-verification.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Role } from '../common/enums/role.enum';
import { ApiTags } from '@nestjs/swagger';
import { ApiRoute } from '../common/swagger/api-route.decorator';

@ApiTags('Document Verifications')
@Controller('document-verifications')
@UseGuards(RolesGuard)
export class DocumentVerificationsController {
  constructor(
    private readonly verificationsService: DocumentVerificationsService,
  ) {}

  @Post()
  @Roles(Role.FIELD_OFFICER, Role.DEPARTMENT_OFFICER)
  @ApiRoute({
    summary: 'Create document verification',
    roles: [Role.FIELD_OFFICER, Role.DEPARTMENT_OFFICER],
    bodyType: CreateDocumentVerificationDto,
    status: 201,
    responseExample: { verification_id: 1, verification_status: 'pending' },
  })
  create(@Body() createDto: CreateDocumentVerificationDto) {
    return this.verificationsService.create(createDto);
  }

  @Get()
  @Roles(Role.DEPARTMENT_OFFICER)
  @ApiRoute({
    summary: 'List document verifications',
    roles: [Role.DEPARTMENT_OFFICER],
    responseExample: [{ verification_id: 1, application_id: 1 }],
  })
  findAll() {
    return this.verificationsService.findAll();
  }

  @Get('application/:applicationId')
  @Roles(Role.FIELD_OFFICER, Role.DEPARTMENT_OFFICER, Role.APPLICANT)
  @ApiRoute({
    summary: 'List document verifications by application',
    roles: [Role.FIELD_OFFICER, Role.DEPARTMENT_OFFICER, Role.APPLICANT],
    params: [{ name: 'applicationId', description: 'Application ID' }],
    responseExample: [{ verification_id: 1, application_id: 1 }],
  })
  findByApplication(
    @Param('applicationId', ParseIntPipe) applicationId: number,
  ) {
    return this.verificationsService.findByApplication(applicationId);
  }

  @Get('field-officer/:foId')
  @Roles(Role.FIELD_OFFICER, Role.DEPARTMENT_OFFICER)
  @ApiRoute({
    summary: 'List document verifications by field officer',
    roles: [Role.FIELD_OFFICER, Role.DEPARTMENT_OFFICER],
    params: [{ name: 'foId', description: 'Field officer user ID' }],
    responseExample: [{ verification_id: 1, field_officer_id: 2 }],
  })
  findByFieldOfficer(
    @Param('foId', ParseIntPipe) foId: number,
  ) {
    return this.verificationsService.findByFieldOfficer(foId);
  }

  @Get(':id')
  @Roles(Role.FIELD_OFFICER, Role.DEPARTMENT_OFFICER)
  @ApiRoute({
    summary: 'Get document verification by ID',
    roles: [Role.FIELD_OFFICER, Role.DEPARTMENT_OFFICER],
    params: [{ name: 'id', description: 'Document verification ID' }],
    responseExample: { verification_id: 1, verification_status: 'pending' },
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.verificationsService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.FIELD_OFFICER, Role.DEPARTMENT_OFFICER)
  @ApiRoute({
    summary: 'Update document verification by ID',
    roles: [Role.FIELD_OFFICER, Role.DEPARTMENT_OFFICER],
    params: [{ name: 'id', description: 'Document verification ID' }],
    bodyType: UpdateDocumentVerificationDto,
    responseExample: { verification_id: 1, verification_status: 'verified' },
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateDocumentVerificationDto,
  ) {
    return this.verificationsService.update(id, updateDto);
  }

  @Delete(':id')
  @Roles(Role.DEPARTMENT_OFFICER)
  @ApiRoute({
    summary: 'Delete document verification by ID',
    roles: [Role.DEPARTMENT_OFFICER],
    params: [{ name: 'id', description: 'Document verification ID' }],
    responseExample: true,
  })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.verificationsService.remove(id);
  }
}
