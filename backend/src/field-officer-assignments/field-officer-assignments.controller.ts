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

@ApiTags('Field Officer Assignments')
@Controller('field-officer-assignments')
@UseGuards(RolesGuard)
export class FieldOfficerAssignmentsController {
  constructor(private readonly service: FieldOfficerAssignmentsService) {}

  @Post()
  @Roles(Role.DEPARTMENT_OFFICER)
  create(@Body() createDto: CreateAssignmentDto) {
    return this.service.create(createDto);
  }

  @Get()
  @Roles(Role.DEPARTMENT_OFFICER)
  findAll() {
    return this.service.findAll();
  }

  @Get('application/:applicationId')
  @Roles(Role.DEPARTMENT_OFFICER, Role.FIELD_OFFICER)
  findByApplication(@Param('applicationId', ParseIntPipe) applicationId: number) {
    return this.service.findByApplication(applicationId);
  }

  @Get('field-officer/:fieldOfficerId')
  @Roles(Role.DEPARTMENT_OFFICER, Role.FIELD_OFFICER)
  findByFieldOfficer(@Param('fieldOfficerId', ParseIntPipe) fieldOfficerId: number) {
    return this.service.findByFieldOfficer(fieldOfficerId);
  }

  @Get(':id')
  @Roles(Role.DEPARTMENT_OFFICER, Role.FIELD_OFFICER)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.DEPARTMENT_OFFICER, Role.FIELD_OFFICER)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateAssignmentDto,
  ) {
    return this.service.update(id, updateDto);
  }

  @Get(':id/sla')
  @Roles(Role.DEPARTMENT_OFFICER, Role.FIELD_OFFICER)
  checkSLA(@Param('id', ParseIntPipe) id: number) {
    return this.service.checkSLA(id);
  }

  @Delete(':id')
  @Roles(Role.DEPARTMENT_OFFICER)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
