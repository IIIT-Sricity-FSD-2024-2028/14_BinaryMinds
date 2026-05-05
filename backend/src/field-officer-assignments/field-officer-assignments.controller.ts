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
import { FieldOfficerAssignmentsService } from './field-officer-assignments.service';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { UpdateAssignmentDto } from './dto/update-assignment.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Role } from '../common/enums/role.enum';
import { ApiTags } from '@nestjs/swagger';
import { ApiRoute } from '../common/swagger/api-route.decorator';

@ApiTags('Field Officer Assignments')
@Controller('field-officer-assignments')
@UseGuards(RolesGuard)
export class FieldOfficerAssignmentsController {
  constructor(private readonly service: FieldOfficerAssignmentsService) {}

  @Post()
  @Roles(Role.DEPARTMENT_OFFICER)
  @ApiRoute({
    summary: 'Create field officer assignment',
    roles: [Role.DEPARTMENT_OFFICER],
    bodyType: CreateAssignmentDto,
    status: 201,
    responseExample: { assignment_id: 1, application_id: 1, field_officer_id: 2 },
  })
  create(@Body() createDto: CreateAssignmentDto) {
    return this.service.create(createDto);
  }

  @Get()
  @Roles(Role.DEPARTMENT_OFFICER)
  @ApiRoute({
    summary: 'List field officer assignments',
    roles: [Role.DEPARTMENT_OFFICER],
    responseExample: [{ assignment_id: 1, application_id: 1 }],
  })
  findAll() {
    return this.service.findAll();
  }

  @Get('application/:applicationId')
  @Roles(Role.DEPARTMENT_OFFICER, Role.FIELD_OFFICER)
  @ApiRoute({
    summary: 'List assignments by application',
    roles: [Role.DEPARTMENT_OFFICER, Role.FIELD_OFFICER],
    params: [{ name: 'applicationId', description: 'Application ID' }],
    responseExample: [{ assignment_id: 1, application_id: 1 }],
  })
  findByApplication(@Param('applicationId', ParseIntPipe) applicationId: number) {
    return this.service.findByApplication(applicationId);
  }

  @Get('field-officer/:fieldOfficerId')
  @Roles(Role.DEPARTMENT_OFFICER, Role.FIELD_OFFICER)
  @ApiRoute({
    summary: 'List assignments by field officer',
    roles: [Role.DEPARTMENT_OFFICER, Role.FIELD_OFFICER],
    params: [{ name: 'fieldOfficerId', description: 'Field officer user ID' }],
    responseExample: [{ assignment_id: 1, field_officer_id: 2 }],
  })
  findByFieldOfficer(@Param('fieldOfficerId', ParseIntPipe) fieldOfficerId: number) {
    return this.service.findByFieldOfficer(fieldOfficerId);
  }

  @Get(':id')
  @Roles(Role.DEPARTMENT_OFFICER, Role.FIELD_OFFICER)
  @ApiRoute({
    summary: 'Get assignment by ID',
    roles: [Role.DEPARTMENT_OFFICER, Role.FIELD_OFFICER],
    params: [{ name: 'id', description: 'Assignment ID' }],
    responseExample: { assignment_id: 1, application_id: 1 },
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.DEPARTMENT_OFFICER, Role.FIELD_OFFICER)
  @ApiRoute({
    summary: 'Update assignment by ID',
    roles: [Role.DEPARTMENT_OFFICER, Role.FIELD_OFFICER],
    params: [{ name: 'id', description: 'Assignment ID' }],
    bodyType: UpdateAssignmentDto,
    responseExample: { assignment_id: 1, assignment_status: 'completed' },
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateAssignmentDto,
  ) {
    return this.service.update(id, updateDto);
  }

  @Get(':id/sla')
  @Roles(Role.DEPARTMENT_OFFICER, Role.FIELD_OFFICER)
  @ApiRoute({
    summary: 'Check assignment SLA',
    roles: [Role.DEPARTMENT_OFFICER, Role.FIELD_OFFICER],
    params: [{ name: 'id', description: 'Assignment ID' }],
    responseExample: { assignment_id: 1, slaBreached: false },
  })
  checkSLA(@Param('id', ParseIntPipe) id: number) {
    return this.service.checkSLA(id);
  }

  @Delete(':id')
  @Roles(Role.DEPARTMENT_OFFICER)
  @ApiRoute({
    summary: 'Delete assignment by ID',
    roles: [Role.DEPARTMENT_OFFICER],
    params: [{ name: 'id', description: 'Assignment ID' }],
    responseExample: true,
  })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
