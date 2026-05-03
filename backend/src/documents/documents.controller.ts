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

@ApiTags('Documents')
@Controller('documents')
@UseGuards(RolesGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post()
  @Roles(Role.APPLICANT, Role.DEPARTMENT_OFFICER)
  create(@Body() createDocumentDto: CreateDocumentDto) {
    return this.documentsService.create(createDocumentDto);
  }

  @Get()
  @Roles(Role.DEPARTMENT_OFFICER, Role.FIELD_OFFICER)
  findAll() {
    return this.documentsService.findAll();
  }

  @Get('application/:applicationId')
  @Roles(Role.APPLICANT, Role.DEPARTMENT_OFFICER, Role.FIELD_OFFICER)
  findByApplication(
    @Param('applicationId', ParseIntPipe) applicationId: number,
  ) {
    return this.documentsService.findByApplication(applicationId);
  }

  @Get(':id')
  @Roles(Role.APPLICANT, Role.DEPARTMENT_OFFICER, Role.FIELD_OFFICER)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.documentsService.findOne(id);
  }

  @Patch(':id/status')
  @Roles(Role.DEPARTMENT_OFFICER, Role.FIELD_OFFICER)
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: VerificationStatus,
  ) {
    return this.documentsService.updateVerificationStatus(id, status);
  }

  @Delete(':id')
  @Roles(Role.DEPARTMENT_OFFICER, Role.APPLICANT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.documentsService.remove(id);
  }
}
