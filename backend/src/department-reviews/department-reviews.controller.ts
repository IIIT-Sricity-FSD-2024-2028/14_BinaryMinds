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
import { ApiRoute } from '../common/swagger/api-route.decorator';

@ApiTags('Department Reviews')
@Controller('department-reviews')
@UseGuards(RolesGuard)
export class DepartmentReviewsController {
  constructor(private readonly service: DepartmentReviewsService) {}

  @Post()
  @Roles(Role.DEPARTMENT_OFFICER)
  @ApiRoute({
    summary: 'Create department review',
    roles: [Role.DEPARTMENT_OFFICER],
    bodyType: CreateDepartmentReviewDto,
    status: 201,
    responseExample: { review_id: 1, review_status: 'pending' },
  })
  create(@Body() createDto: CreateDepartmentReviewDto) {
    return this.service.create(createDto);
  }

  @Get()
  @Roles(Role.DEPARTMENT_OFFICER, Role.SUPER_USER)
  @ApiRoute({
    summary: 'List department reviews',
    roles: [Role.DEPARTMENT_OFFICER, Role.SUPER_USER],
    responseExample: [{ review_id: 1, application_id: 1 }],
  })
  findAll() {
    return this.service.findAll();
  }

  @Get('application/:applicationId')
  @Roles(Role.DEPARTMENT_OFFICER, Role.FIELD_OFFICER, Role.APPLICANT)
  @ApiRoute({
    summary: 'List reviews by application',
    roles: [Role.DEPARTMENT_OFFICER, Role.FIELD_OFFICER, Role.APPLICANT],
    params: [{ name: 'applicationId', description: 'Application ID' }],
    responseExample: [{ review_id: 1, application_id: 1 }],
  })
  findByApplication(@Param('applicationId', ParseIntPipe) applicationId: number) {
    return this.service.findByApplication(applicationId);
  }

  @Get('reviewer/:reviewerId')
  @Roles(Role.DEPARTMENT_OFFICER, Role.SUPER_USER)
  @ApiRoute({
    summary: 'List reviews by reviewer',
    roles: [Role.DEPARTMENT_OFFICER, Role.SUPER_USER],
    params: [{ name: 'reviewerId', description: 'Reviewer user ID' }],
    responseExample: [{ review_id: 1, reviewed_by: 4 }],
  })
  findByReviewer(@Param('reviewerId', ParseIntPipe) reviewerId: number) {
    return this.service.findByReviewer(reviewerId);
  }

  @Get(':id')
  @Roles(Role.DEPARTMENT_OFFICER, Role.FIELD_OFFICER, Role.APPLICANT)
  @ApiRoute({
    summary: 'Get department review by ID',
    roles: [Role.DEPARTMENT_OFFICER, Role.FIELD_OFFICER, Role.APPLICANT],
    params: [{ name: 'id', description: 'Review ID' }],
    responseExample: { review_id: 1, review_status: 'pending' },
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.DEPARTMENT_OFFICER)
  @ApiRoute({
    summary: 'Update department review by ID',
    roles: [Role.DEPARTMENT_OFFICER],
    params: [{ name: 'id', description: 'Review ID' }],
    bodyType: UpdateDepartmentReviewDto,
    responseExample: { review_id: 1, review_status: 'approved' },
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateDepartmentReviewDto,
  ) {
    return this.service.update(id, updateDto);
  }

  @Post(':id/sign')
  @Roles(Role.DEPARTMENT_OFFICER)
  @ApiRoute({
    summary: 'Digitally sign a department review',
    roles: [Role.DEPARTMENT_OFFICER],
    params: [{ name: 'id', description: 'Review ID' }],
    bodyType: SignReviewDto,
    status: 201,
    responseExample: { review_id: 1, digital_signature: 'signed-token' },
  })
  signReview(
    @Param('id', ParseIntPipe) id: number,
    @Body() signDto: SignReviewDto,
  ) {
    return this.service.signReview(id, signDto.digital_signature);
  }

  @Delete(':id')
  @Roles(Role.SUPER_USER)
  @ApiRoute({
    summary: 'Delete department review by ID',
    roles: [Role.SUPER_USER],
    params: [{ name: 'id', description: 'Review ID' }],
    responseExample: true,
  })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
