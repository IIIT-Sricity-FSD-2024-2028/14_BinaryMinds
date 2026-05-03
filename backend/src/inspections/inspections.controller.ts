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

@ApiTags('Inspections')
@Controller('inspections')
@UseGuards(RolesGuard)
export class InspectionsController {
  constructor(private readonly service: InspectionsService) {}

  @Post()
  @Roles(Role.DEPARTMENT_OFFICER, Role.FIELD_OFFICER)
  create(@Body() createDto: CreateInspectionDto) {
    return this.service.create(createDto);
  }

  @Get()
  @Roles(Role.DEPARTMENT_OFFICER, Role.FIELD_OFFICER)
  findAll() {
    return this.service.findAll();
  }

  @Get('assignment/:assignmentId')
  @Roles(Role.DEPARTMENT_OFFICER, Role.FIELD_OFFICER)
  findByAssignment(@Param('assignmentId', ParseIntPipe) assignmentId: number) {
    return this.service.findByAssignment(assignmentId);
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
    @Body() updateDto: UpdateInspectionDto,
  ) {
    return this.service.update(id, updateDto);
  }

  @Post(':id/report')
  @Roles(Role.FIELD_OFFICER, Role.DEPARTMENT_OFFICER)
  submitReport(
    @Param('id', ParseIntPipe) id: number,
    @Body() reportDto: SubmitInspectionReportDto,
  ) {
    return this.service.submitReport(id, reportDto);
  }

  @Delete(':id')
  @Roles(Role.DEPARTMENT_OFFICER)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
