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
import { LicensesService } from './licenses.service';
import { CreateLicenseDto } from './dto/create-license.dto';
import { UpdateLicenseDto } from './dto/update-license.dto';
import { RenewLicenseDto } from './dto/renew-license.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Role } from '../common/enums/role.enum';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Licenses')
@Controller('licenses')
@UseGuards(RolesGuard)
export class LicensesController {
  constructor(private readonly service: LicensesService) {}

  @Post()
  @Roles(Role.DEPARTMENT_OFFICER, Role.SUPER_USER)
  create(@Body() createDto: CreateLicenseDto) {
    return this.service.create(createDto);
  }

  @Get()
  @Roles(Role.DEPARTMENT_OFFICER, Role.SUPER_USER, Role.FIELD_OFFICER)
  findAll() {
    return this.service.findAll();
  }

  @Get('application/:applicationId')
  @Roles(Role.DEPARTMENT_OFFICER, Role.SUPER_USER, Role.FIELD_OFFICER, Role.APPLICANT)
  findByApplication(@Param('applicationId', ParseIntPipe) applicationId: number) {
    return this.service.findByApplication(applicationId);
  }

  @Get('number/:licenseNumber')
  @Roles(Role.DEPARTMENT_OFFICER, Role.SUPER_USER, Role.FIELD_OFFICER, Role.APPLICANT)
  findByLicenseNumber(@Param('licenseNumber') licenseNumber: string) {
    return this.service.findByLicenseNumber(licenseNumber);
  }

  @Get(':id')
  @Roles(Role.DEPARTMENT_OFFICER, Role.SUPER_USER, Role.FIELD_OFFICER, Role.APPLICANT)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.DEPARTMENT_OFFICER, Role.SUPER_USER)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateLicenseDto,
  ) {
    return this.service.update(id, updateDto);
  }

  @Post(':id/suspend')
  @Roles(Role.DEPARTMENT_OFFICER, Role.SUPER_USER)
  suspend(@Param('id', ParseIntPipe) id: number) {
    return this.service.suspend(id);
  }

  @Post(':id/revoke')
  @Roles(Role.DEPARTMENT_OFFICER, Role.SUPER_USER)
  revoke(@Param('id', ParseIntPipe) id: number) {
    return this.service.revoke(id);
  }

  @Post(':id/renew')
  @Roles(Role.DEPARTMENT_OFFICER, Role.SUPER_USER)
  renew(
    @Param('id', ParseIntPipe) id: number,
    @Body() renewDto: RenewLicenseDto,
  ) {
    return this.service.renew(id, renewDto.new_expiry_date);
  }

  @Delete(':id')
  @Roles(Role.SUPER_USER)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
