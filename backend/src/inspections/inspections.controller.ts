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

@ApiTags('Inspections')
@Controller('inspections')
@UseGuards(RolesGuard)
export class InspectionsController {
  constructor(
    private readonly service: InspectionsService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  @Post()
  @Roles(Role.DEPARTMENT_OFFICER, Role.FIELD_OFFICER)
  @ApiRoute({
    summary: 'Create inspection',
    roles: [Role.DEPARTMENT_OFFICER, Role.FIELD_OFFICER],
    bodyType: CreateInspectionDto,
    status: 201,
    responseExample: { inspection_id: 1, assignment_id: 1, status: 'scheduled' },
  })
  create(@Body() createDto: CreateInspectionDto) {
    const inspection = this.service.create(createDto);
    this.auditLogsService.log({
      user_name: 'Field Officer',
      role: 'field_officer',
      action: 'Create',
      module: 'Inspections',
      description: `Created inspection ${inspection.inspection_id}`,
      ip_address: '127.0.0.1',
      source: 'backend',
    });
    return inspection;
  }

  @Get()
  @Roles(Role.DEPARTMENT_OFFICER, Role.FIELD_OFFICER)
  @ApiRoute({
    summary: 'List inspections',
    roles: [Role.DEPARTMENT_OFFICER, Role.FIELD_OFFICER],
    responseExample: [{ inspection_id: 1, assignment_id: 1 }],
  })
  findAll() {
    return this.service.findAll();
  }

  @Get('assignment/:assignmentId')
  @Roles(Role.DEPARTMENT_OFFICER, Role.FIELD_OFFICER)
  @ApiRoute({
    summary: 'List inspections by assignment',
    roles: [Role.DEPARTMENT_OFFICER, Role.FIELD_OFFICER],
    params: [{ name: 'assignmentId', description: 'Assignment ID' }],
    responseExample: [{ inspection_id: 1, assignment_id: 1 }],
  })
  findByAssignment(@Param('assignmentId', ParseIntPipe) assignmentId: number) {
    return this.service.findByAssignment(assignmentId);
  }

  @Get('field-officer/:fieldOfficerId')
  @Roles(Role.DEPARTMENT_OFFICER, Role.FIELD_OFFICER)
  @ApiRoute({
    summary: 'List inspections by field officer',
    roles: [Role.DEPARTMENT_OFFICER, Role.FIELD_OFFICER],
    params: [{ name: 'fieldOfficerId', description: 'Field officer user ID' }],
    responseExample: [{ inspection_id: 1, field_officer_id: 2 }],
  })
  findByFieldOfficer(@Param('fieldOfficerId', ParseIntPipe) fieldOfficerId: number) {
    return this.service.findByFieldOfficer(fieldOfficerId);
  }

  @Get(':id')
  @Roles(Role.DEPARTMENT_OFFICER, Role.FIELD_OFFICER)
  @ApiRoute({
    summary: 'Get inspection by ID',
    roles: [Role.DEPARTMENT_OFFICER, Role.FIELD_OFFICER],
    params: [{ name: 'id', description: 'Inspection ID' }],
    responseExample: { inspection_id: 1, status: 'scheduled' },
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.DEPARTMENT_OFFICER, Role.FIELD_OFFICER)
  @ApiRoute({
    summary: 'Update inspection by ID',
    roles: [Role.DEPARTMENT_OFFICER, Role.FIELD_OFFICER],
    params: [{ name: 'id', description: 'Inspection ID' }],
    bodyType: UpdateInspectionDto,
    responseExample: { inspection_id: 1, status: 'completed' },
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateInspectionDto,
  ) {
    const inspection = this.service.update(id, updateDto);
    this.auditLogsService.log({
      user_name: 'Field Officer',
      role: 'field_officer',
      action: 'Update',
      module: 'Inspections',
      description: `Updated inspection ${id}`,
      ip_address: '127.0.0.1',
      source: 'backend',
    });
    return inspection;
  }

  @Post(':id/report')
  @Roles(Role.FIELD_OFFICER, Role.DEPARTMENT_OFFICER)
  @ApiRoute({
    summary: 'Submit inspection report',
    roles: [Role.FIELD_OFFICER, Role.DEPARTMENT_OFFICER],
    params: [{ name: 'id', description: 'Inspection ID' }],
    bodyType: SubmitInspectionReportDto,
    status: 201,
    responseExample: { inspection_id: 1, status: 'completed', result: 'approved' },
  })
  submitReport(
    @Param('id', ParseIntPipe) id: number,
    @Body() reportDto: SubmitInspectionReportDto,
  ) {
    return this.service.submitReport(id, reportDto);
  }

  @Delete(':id')
  @Roles(Role.DEPARTMENT_OFFICER)
  @ApiRoute({
    summary: 'Delete inspection by ID',
    roles: [Role.DEPARTMENT_OFFICER],
    params: [{ name: 'id', description: 'Inspection ID' }],
    responseExample: true,
  })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
