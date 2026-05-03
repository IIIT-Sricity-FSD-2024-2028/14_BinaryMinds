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
import { ApplicationsService } from './applications.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Role } from '../common/enums/role.enum';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Applications')
@Controller('applications')
@UseGuards(RolesGuard)
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Post()
  @Roles(Role.APPLICANT, Role.DEPARTMENT_OFFICER)
  create(@Body() createApplicationDto: CreateApplicationDto) {
    return this.applicationsService.create(createApplicationDto);
  }

  @Get()
  @Roles(Role.DEPARTMENT_OFFICER, Role.FIELD_OFFICER)
  findAll() {
    return this.applicationsService.findAll();
  }

  @Get('applicant/:applicantId')
  @Roles(Role.APPLICANT, Role.DEPARTMENT_OFFICER, Role.FIELD_OFFICER)
  findByApplicant(@Param('applicantId', ParseIntPipe) applicantId: number) {
    return this.applicationsService.findByApplicant(applicantId);
  }

  @Get(':id')
  @Roles(Role.APPLICANT, Role.DEPARTMENT_OFFICER, Role.FIELD_OFFICER)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.applicationsService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.DEPARTMENT_OFFICER, Role.FIELD_OFFICER, Role.APPLICANT)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateApplicationDto: UpdateApplicationDto,
  ) {
    return this.applicationsService.update(id, updateApplicationDto);
  }

  @Delete(':id')
  @Roles(Role.DEPARTMENT_OFFICER)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.applicationsService.remove(id);
  }
}
