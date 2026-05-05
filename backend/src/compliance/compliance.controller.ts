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
import { ApiRoute } from '../common/swagger/api-route.decorator';

@ApiTags('Compliance')
@Controller('compliance')
@UseGuards(RolesGuard)
export class ComplianceController {
  constructor(private readonly service: ComplianceService) {}

  @Post()
  @Roles(Role.FIELD_OFFICER, Role.DEPARTMENT_OFFICER, Role.SUPER_USER)
  @ApiRoute({
    summary: 'Create compliance record',
    roles: [Role.FIELD_OFFICER, Role.DEPARTMENT_OFFICER, Role.SUPER_USER],
    bodyType: CreateComplianceRecordDto,
    status: 201,
    responseExample: { compliance_id: 1, compliance_status: 'pending' },
  })
  create(@Body() createDto: CreateComplianceRecordDto) {
    return this.service.create(createDto);
  }

  @Get()
  @Roles(Role.DEPARTMENT_OFFICER, Role.SUPER_USER)
  @ApiRoute({
    summary: 'List compliance records',
    roles: [Role.DEPARTMENT_OFFICER, Role.SUPER_USER],
    responseExample: [{ compliance_id: 1, license_id: 1 }],
  })
  findAll() {
    return this.service.findAll();
  }

  @Get('license/:licenseId')
  @Roles(Role.DEPARTMENT_OFFICER, Role.SUPER_USER, Role.FIELD_OFFICER, Role.APPLICANT)
  @ApiRoute({
    summary: 'List compliance records by license',
    roles: [Role.DEPARTMENT_OFFICER, Role.SUPER_USER, Role.FIELD_OFFICER, Role.APPLICANT],
    params: [{ name: 'licenseId', description: 'License ID' }],
    responseExample: [{ compliance_id: 1, license_id: 1 }],
  })
  findByLicense(@Param('licenseId', ParseIntPipe) licenseId: number) {
    return this.service.findByLicense(licenseId);
  }

  @Get('field-officer/:fieldOfficerId')
  @Roles(Role.DEPARTMENT_OFFICER, Role.SUPER_USER, Role.FIELD_OFFICER)
  @ApiRoute({
    summary: 'List compliance records by field officer',
    roles: [Role.DEPARTMENT_OFFICER, Role.SUPER_USER, Role.FIELD_OFFICER],
    params: [{ name: 'fieldOfficerId', description: 'Field officer user ID' }],
    responseExample: [{ compliance_id: 1, field_officer_id: 2 }],
  })
  findByFieldOfficer(@Param('fieldOfficerId', ParseIntPipe) fieldOfficerId: number) {
    return this.service.findByFieldOfficer(fieldOfficerId);
  }

  @Get(':id')
  @Roles(Role.DEPARTMENT_OFFICER, Role.SUPER_USER, Role.FIELD_OFFICER, Role.APPLICANT)
  @ApiRoute({
    summary: 'Get compliance record by ID',
    roles: [Role.DEPARTMENT_OFFICER, Role.SUPER_USER, Role.FIELD_OFFICER, Role.APPLICANT],
    params: [{ name: 'id', description: 'Compliance record ID' }],
    responseExample: { compliance_id: 1, compliance_status: 'pending' },
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.FIELD_OFFICER, Role.DEPARTMENT_OFFICER, Role.SUPER_USER)
  @ApiRoute({
    summary: 'Update compliance record by ID',
    roles: [Role.FIELD_OFFICER, Role.DEPARTMENT_OFFICER, Role.SUPER_USER],
    params: [{ name: 'id', description: 'Compliance record ID' }],
    bodyType: UpdateComplianceRecordDto,
    responseExample: { compliance_id: 1, compliance_status: 'resolved' },
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateComplianceRecordDto,
  ) {
    return this.service.update(id, updateDto);
  }

  @Post(':id/resolve')
  @Roles(Role.FIELD_OFFICER, Role.DEPARTMENT_OFFICER, Role.SUPER_USER)
  @ApiRoute({
    summary: 'Resolve compliance warning',
    roles: [Role.FIELD_OFFICER, Role.DEPARTMENT_OFFICER, Role.SUPER_USER],
    params: [{ name: 'id', description: 'Compliance record ID' }],
    status: 201,
    responseExample: { compliance_id: 1, compliance_status: 'resolved' },
  })
  resolveWarning(@Param('id', ParseIntPipe) id: number) {
    return this.service.resolveWarning(id);
  }

  @Post(':id/escalate')
  @Roles(Role.FIELD_OFFICER, Role.DEPARTMENT_OFFICER, Role.SUPER_USER)
  @ApiRoute({
    summary: 'Escalate compliance warning',
    roles: [Role.FIELD_OFFICER, Role.DEPARTMENT_OFFICER, Role.SUPER_USER],
    params: [{ name: 'id', description: 'Compliance record ID' }],
    status: 201,
    responseExample: { compliance_id: 1, compliance_status: 'escalated' },
  })
  escalateWarning(@Param('id', ParseIntPipe) id: number) {
    return this.service.escalateWarning(id);
  }

  @Delete(':id')
  @Roles(Role.SUPER_USER)
  @ApiRoute({
    summary: 'Delete compliance record by ID',
    roles: [Role.SUPER_USER],
    params: [{ name: 'id', description: 'Compliance record ID' }],
    responseExample: true,
  })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
