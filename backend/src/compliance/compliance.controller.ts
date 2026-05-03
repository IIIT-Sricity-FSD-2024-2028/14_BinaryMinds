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
import { ComplianceService } from './compliance.service';
import { CreateComplianceRecordDto } from './dto/create-compliance-record.dto';
import { UpdateComplianceRecordDto } from './dto/update-compliance-record.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Role } from '../common/enums/role.enum';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Compliance')
@Controller('compliance')
@UseGuards(RolesGuard)
export class ComplianceController {
  constructor(private readonly service: ComplianceService) {}

  @Post()
  @Roles(Role.FIELD_OFFICER, Role.DEPARTMENT_OFFICER, Role.SUPER_USER)
  create(@Body() createDto: CreateComplianceRecordDto) {
    return this.service.create(createDto);
  }

  @Get()
  @Roles(Role.DEPARTMENT_OFFICER, Role.SUPER_USER)
  findAll() {
    return this.service.findAll();
  }

  @Get('license/:licenseId')
  @Roles(Role.DEPARTMENT_OFFICER, Role.SUPER_USER, Role.FIELD_OFFICER, Role.APPLICANT)
  findByLicense(@Param('licenseId', ParseIntPipe) licenseId: number) {
    return this.service.findByLicense(licenseId);
  }

  @Get('field-officer/:fieldOfficerId')
  @Roles(Role.DEPARTMENT_OFFICER, Role.SUPER_USER, Role.FIELD_OFFICER)
  findByFieldOfficer(@Param('fieldOfficerId', ParseIntPipe) fieldOfficerId: number) {
    return this.service.findByFieldOfficer(fieldOfficerId);
  }

  @Get(':id')
  @Roles(Role.DEPARTMENT_OFFICER, Role.SUPER_USER, Role.FIELD_OFFICER, Role.APPLICANT)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.FIELD_OFFICER, Role.DEPARTMENT_OFFICER, Role.SUPER_USER)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateComplianceRecordDto,
  ) {
    return this.service.update(id, updateDto);
  }

  @Post(':id/resolve')
  @Roles(Role.FIELD_OFFICER, Role.DEPARTMENT_OFFICER, Role.SUPER_USER)
  resolveWarning(@Param('id', ParseIntPipe) id: number) {
    return this.service.resolveWarning(id);
  }

  @Post(':id/escalate')
  @Roles(Role.FIELD_OFFICER, Role.DEPARTMENT_OFFICER, Role.SUPER_USER)
  escalateWarning(@Param('id', ParseIntPipe) id: number) {
    return this.service.escalateWarning(id);
  }

  @Delete(':id')
  @Roles(Role.SUPER_USER)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
