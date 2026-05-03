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
import { DepartmentReviewsService } from './department-reviews.service';
import { CreateDepartmentReviewDto } from './dto/create-department-review.dto';
import { UpdateDepartmentReviewDto } from './dto/update-department-review.dto';
import { SignReviewDto } from './dto/sign-review.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Role } from '../common/enums/role.enum';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Department Reviews')
@Controller('department-reviews')
@UseGuards(RolesGuard)
export class DepartmentReviewsController {
  constructor(private readonly service: DepartmentReviewsService) {}

  @Post()
  @Roles(Role.DEPARTMENT_OFFICER)
  create(@Body() createDto: CreateDepartmentReviewDto) {
    return this.service.create(createDto);
  }

  @Get()
  @Roles(Role.DEPARTMENT_OFFICER, Role.SUPER_USER)
  findAll() {
    return this.service.findAll();
  }

  @Get('application/:applicationId')
  @Roles(Role.DEPARTMENT_OFFICER, Role.FIELD_OFFICER, Role.APPLICANT)
  findByApplication(@Param('applicationId', ParseIntPipe) applicationId: number) {
    return this.service.findByApplication(applicationId);
  }

  @Get('reviewer/:reviewerId')
  @Roles(Role.DEPARTMENT_OFFICER, Role.SUPER_USER)
  findByReviewer(@Param('reviewerId', ParseIntPipe) reviewerId: number) {
    return this.service.findByReviewer(reviewerId);
  }

  @Get(':id')
  @Roles(Role.DEPARTMENT_OFFICER, Role.FIELD_OFFICER, Role.APPLICANT)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.DEPARTMENT_OFFICER)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateDepartmentReviewDto,
  ) {
    return this.service.update(id, updateDto);
  }

  @Post(':id/sign')
  @Roles(Role.DEPARTMENT_OFFICER)
  signReview(
    @Param('id', ParseIntPipe) id: number,
    @Body() signDto: SignReviewDto,
  ) {
    return this.service.signReview(id, signDto.digital_signature);
  }

  @Delete(':id')
  @Roles(Role.SUPER_USER)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
