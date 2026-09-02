import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  Req,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';
import { DepartmentReviewsService } from './department-reviews.service';
import { CreateDepartmentReviewDto } from './dto/create-department-review.dto';
import { UpdateDepartmentReviewDto } from './dto/update-department-review.dto';
import { SignReviewDto } from './dto/sign-review.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Role } from '../common/enums/role.enum';
import { ApiTags } from '@nestjs/swagger';
import { ApiRoute } from '../common/swagger/api-route.decorator';
import { AuthenticatedUser } from '../auth/auth-session.interface';

import { ApplicationsService } from '../applications/applications.service';

@ApiTags('Department Reviews')
@Controller('department-reviews')
@UseGuards(RolesGuard)
export class DepartmentReviewsController {
  constructor(
    private readonly service: DepartmentReviewsService,
    private readonly applicationsService: ApplicationsService,
  ) {}

  @Post()
  @Roles(Role.DEPARTMENT_OFFICER, Role.SUPER_USER, Role.PLATFORM_ADMIN)
  @ApiRoute({
    summary: 'Create department review',
    roles: [Role.DEPARTMENT_OFFICER, Role.SUPER_USER, Role.PLATFORM_ADMIN],
    bodyType: CreateDepartmentReviewDto,
    status: 201,
    responseExample: { review_id: 1, review_status: 'pending' },
  })
  create(@Body() createDto: CreateDepartmentReviewDto) {
    return this.service.create(createDto);
  }

  @Get()
  @Roles(Role.DEPARTMENT_OFFICER, Role.SUPER_USER, Role.PLATFORM_ADMIN)
  @ApiRoute({
    summary: 'List department reviews',
    roles: [Role.DEPARTMENT_OFFICER, Role.SUPER_USER, Role.PLATFORM_ADMIN],
    responseExample: [{ review_id: 1, application_id: 1 }],
  })
  findAll(@Req() request: Request & { user: AuthenticatedUser }) {
    if (request.user.role === Role.PLATFORM_ADMIN) {
      return this.service.findAll();
    }
    const userMuni = request.user.municipalityId;
    if (!userMuni) return [];
    const appsInMuni = new Set(this.applicationsService.findAll(userMuni).map((a) => a.application_id));
    return this.service.findAll().filter((r) => appsInMuni.has(r.application_id));
  }

  @Get('application/:applicationId')
  @Roles(Role.DEPARTMENT_OFFICER, Role.FIELD_OFFICER, Role.APPLICANT, Role.SUPER_USER, Role.PLATFORM_ADMIN)
  @ApiRoute({
    summary: 'List reviews by application',
    roles: [Role.DEPARTMENT_OFFICER, Role.FIELD_OFFICER, Role.APPLICANT, Role.SUPER_USER, Role.PLATFORM_ADMIN],
    params: [{ name: 'applicationId', description: 'Application ID' }],
    responseExample: [{ review_id: 1, application_id: 1 }],
  })
  findByApplication(
    @Param('applicationId', ParseIntPipe) applicationId: number,
    @Req() request: Request & { user: AuthenticatedUser },
  ) {
    const app = this.applicationsService.findOne(applicationId);
    if (request.user.role !== Role.PLATFORM_ADMIN) {
      if (request.user.role === Role.APPLICANT) {
        if (app.applicant_id !== request.user.userId) {
          throw new ForbiddenException('Access denied to review for this application');
        }
      } else {
        const userMuni = request.user.municipalityId;
        if (!userMuni || (app.municipality_id || '').toLowerCase() !== userMuni.toLowerCase()) {
          throw new ForbiddenException('Access denied to review outside your municipality');
        }
      }
    }
    return this.service.findByApplication(applicationId);
  }

  @Get('reviewer/:reviewerId')
  @Roles(Role.DEPARTMENT_OFFICER, Role.SUPER_USER, Role.PLATFORM_ADMIN)
  @ApiRoute({
    summary: 'List reviews by reviewer',
    roles: [Role.DEPARTMENT_OFFICER, Role.SUPER_USER, Role.PLATFORM_ADMIN],
    params: [{ name: 'reviewerId', description: 'Reviewer user ID' }],
    responseExample: [{ review_id: 1, reviewed_by: 4 }],
  })
  findByReviewer(@Param('reviewerId', ParseIntPipe) reviewerId: number) {
    return this.service.findByReviewer(reviewerId);
  }

  @Get(':id')
  @Roles(Role.DEPARTMENT_OFFICER, Role.FIELD_OFFICER, Role.APPLICANT, Role.SUPER_USER, Role.PLATFORM_ADMIN)
  @ApiRoute({
    summary: 'Get department review by ID',
    roles: [Role.DEPARTMENT_OFFICER, Role.FIELD_OFFICER, Role.APPLICANT, Role.SUPER_USER, Role.PLATFORM_ADMIN],
    params: [{ name: 'id', description: 'Review ID' }],
    responseExample: { review_id: 1, review_status: 'pending' },
  })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: Request & { user: AuthenticatedUser },
  ) {
    const review = this.service.findOne(id);
    if (request.user.role !== Role.PLATFORM_ADMIN) {
      const app = this.applicationsService.findOne(review.application_id);
      if (request.user.role === Role.APPLICANT) {
        if (app.applicant_id !== request.user.userId) {
          throw new ForbiddenException('Access denied to review');
        }
      } else {
        const userMuni = request.user.municipalityId;
        if (!userMuni || (app.municipality_id || '').toLowerCase() !== userMuni.toLowerCase()) {
          throw new ForbiddenException('Access denied to review outside your municipality');
        }
      }
    }
    return review;
  }

  @Patch(':id')
  @Roles(Role.DEPARTMENT_OFFICER, Role.SUPER_USER, Role.PLATFORM_ADMIN)
  @ApiRoute({
    summary: 'Update department review by ID',
    roles: [Role.DEPARTMENT_OFFICER, Role.SUPER_USER, Role.PLATFORM_ADMIN],
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
  @Roles(Role.DEPARTMENT_OFFICER, Role.SUPER_USER, Role.PLATFORM_ADMIN)
  @ApiRoute({
    summary: 'Digitally sign a department review',
    roles: [Role.DEPARTMENT_OFFICER, Role.SUPER_USER, Role.PLATFORM_ADMIN],
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
  @Roles(Role.SUPER_USER, Role.PLATFORM_ADMIN)
  @ApiRoute({
    summary: 'Delete department review by ID',
    roles: [Role.SUPER_USER, Role.PLATFORM_ADMIN],
    params: [{ name: 'id', description: 'Review ID' }],
    responseExample: true,
  })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
