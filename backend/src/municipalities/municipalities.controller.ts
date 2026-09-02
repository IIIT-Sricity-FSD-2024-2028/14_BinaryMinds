import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { MunicipalitiesService } from './municipalities.service';
import { CreateMunicipalityDto } from './dto/create-municipality.dto';
import { UpdateMunicipalityDto } from './dto/update-municipality.dto';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { RolesGuard } from '../common/guards/roles.guard';

@Controller('municipalities')
export class MunicipalitiesController {
  constructor(private readonly service: MunicipalitiesService) {}

  @Public()
  @Get()
  findActive() {
    return this.service.findActive();
  }

  @Public()
  @Get('all')
  findAll() {
    return this.service.findAll();
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.PLATFORM_ADMIN)
  create(@Body() dto: CreateMunicipalityDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.PLATFORM_ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateMunicipalityDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.PLATFORM_ADMIN)
  remove(@Param('id') id: string) {
    this.service.remove(id);
    return { message: `Municipality '${id}' removed successfully` };
  }
}
