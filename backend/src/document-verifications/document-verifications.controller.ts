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

@ApiTags('Document Verifications')
@Controller('document-verifications')
@UseGuards(RolesGuard)
export class DocumentVerificationsController {
  constructor(
    private readonly verificationsService: DocumentVerificationsService,
  ) {}

  @Post()
  @Roles(Role.FIELD_OFFICER, Role.DEPARTMENT_OFFICER)
  create(@Body() createDto: CreateDocumentVerificationDto) {
    return this.verificationsService.create(createDto);
  }

  @Get()
  @Roles(Role.DEPARTMENT_OFFICER)
  findAll() {
    return this.verificationsService.findAll();
  }

  @Get('application/:applicationId')
  @Roles(Role.FIELD_OFFICER, Role.DEPARTMENT_OFFICER, Role.APPLICANT)
  findByApplication(
    @Param('applicationId', ParseIntPipe) applicationId: number,
  ) {
    return this.verificationsService.findByApplication(applicationId);
  }

  @Get('field-officer/:foId')
  @Roles(Role.FIELD_OFFICER, Role.DEPARTMENT_OFFICER)
  findByFieldOfficer(
    @Param('foId', ParseIntPipe) foId: number,
  ) {
    return this.verificationsService.findByFieldOfficer(foId);
  }

  @Get(':id')
  @Roles(Role.FIELD_OFFICER, Role.DEPARTMENT_OFFICER)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.verificationsService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.FIELD_OFFICER, Role.DEPARTMENT_OFFICER)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateDocumentVerificationDto,
  ) {
    return this.verificationsService.update(id, updateDto);
  }

  @Delete(':id')
  @Roles(Role.DEPARTMENT_OFFICER)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.verificationsService.remove(id);
  }
}
