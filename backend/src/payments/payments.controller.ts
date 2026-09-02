import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ForbiddenException,
  ParseIntPipe,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Role } from '../common/enums/role.enum';
import { ApiTags } from '@nestjs/swagger';
import { ApiRoute } from '../common/swagger/api-route.decorator';
import { AuthenticatedUser } from '../auth/auth-session.interface';
import { ApplicationsService } from '../applications/applications.service';

@ApiTags('Payments')
@Controller('payments')
@UseGuards(RolesGuard)
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly applicationsService: ApplicationsService,
  ) {}

  @Post()
  @Roles(Role.APPLICANT, Role.DEPARTMENT_OFFICER, Role.SUPER_USER, Role.PLATFORM_ADMIN)
  @ApiRoute({
    summary: 'Create payment',
    roles: [Role.APPLICANT, Role.DEPARTMENT_OFFICER, Role.SUPER_USER, Role.PLATFORM_ADMIN],
    bodyType: CreatePaymentDto,
    status: 201,
    responseExample: { payment_id: 1, payment_status: 'pending', transaction_id: 'TXN-...' },
  })
  create(@Body() createDto: CreatePaymentDto) {
    return this.paymentsService.create(createDto);
  }

  @Get()
  @Roles(Role.DEPARTMENT_OFFICER, Role.FIELD_OFFICER, Role.SUPER_USER, Role.PLATFORM_ADMIN)
  @ApiRoute({
    summary: 'List payments',
    roles: [Role.DEPARTMENT_OFFICER, Role.FIELD_OFFICER, Role.SUPER_USER, Role.PLATFORM_ADMIN],
    responseExample: [{ payment_id: 1, application_id: 1, payment_status: 'pending' }],
  })
  findAll(@Req() request: Request & { user: AuthenticatedUser }) {
    if (request.user.role === Role.PLATFORM_ADMIN) {
      return this.paymentsService.findAll();
    }
    const userMuni = request.user.municipalityId;
    if (!userMuni) return [];
    return this.paymentsService
      .findAll()
      .filter((p) => (p.municipality_id || '').toLowerCase() === userMuni.toLowerCase());
  }

  @Get('application/:applicationId')
  @Roles(Role.APPLICANT, Role.DEPARTMENT_OFFICER, Role.FIELD_OFFICER, Role.SUPER_USER, Role.PLATFORM_ADMIN)
  @ApiRoute({
    summary: 'List payments by application',
    roles: [Role.APPLICANT, Role.DEPARTMENT_OFFICER, Role.FIELD_OFFICER, Role.SUPER_USER, Role.PLATFORM_ADMIN],
    params: [{ name: 'applicationId', description: 'Application ID' }],
    responseExample: [{ payment_id: 1, application_id: 1 }],
  })
  findByApplication(
    @Param('applicationId', ParseIntPipe) applicationId: number,
    @Req() request: Request & { user: AuthenticatedUser },
  ) {
    const app = this.applicationsService.findOne(applicationId);
    if (request.user.role !== Role.PLATFORM_ADMIN) {
      if (request.user.role === Role.APPLICANT) {
        if (app.applicant_id !== request.user.userId) {
          throw new ForbiddenException('Access denied to payments for this application');
        }
      } else {
        const userMuni = request.user.municipalityId;
        if (!userMuni || (app.municipality_id || '').toLowerCase() !== userMuni.toLowerCase()) {
          throw new ForbiddenException('Access denied to payments outside your municipality');
        }
      }
    }
    return this.paymentsService.findByApplication(applicationId);
  }

  @Get(':id')
  @Roles(Role.APPLICANT, Role.DEPARTMENT_OFFICER, Role.FIELD_OFFICER, Role.SUPER_USER, Role.PLATFORM_ADMIN)
  @ApiRoute({
    summary: 'Get payment by ID',
    roles: [Role.APPLICANT, Role.DEPARTMENT_OFFICER, Role.FIELD_OFFICER, Role.SUPER_USER, Role.PLATFORM_ADMIN],
    params: [{ name: 'id', description: 'Payment ID' }],
    responseExample: { payment_id: 1, payment_status: 'pending' },
  })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: Request & { user: AuthenticatedUser },
  ) {
    const payment = this.paymentsService.findOne(id);
    if (request.user.role !== Role.PLATFORM_ADMIN && request.user.role !== Role.APPLICANT) {
      const userMuni = request.user.municipalityId;
      if (!userMuni || (payment.municipality_id || '').toLowerCase() !== userMuni.toLowerCase()) {
        throw new ForbiddenException('Access denied to payments outside your municipality');
      }
    }
    return payment;
  }

  @Patch(':id')
  @Roles(Role.DEPARTMENT_OFFICER, Role.APPLICANT, Role.SUPER_USER, Role.PLATFORM_ADMIN)
  @ApiRoute({
    summary: 'Update payment by ID',
    roles: [Role.DEPARTMENT_OFFICER, Role.APPLICANT, Role.SUPER_USER, Role.PLATFORM_ADMIN],
    params: [{ name: 'id', description: 'Payment ID' }],
    bodyType: UpdatePaymentDto,
    responseExample: { payment_id: 1, payment_status: 'completed' },
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdatePaymentDto,
    @Req() request: Request & { user: AuthenticatedUser },
  ) {
    const existing = this.paymentsService.findOne(id);
    if (request.user.role !== Role.PLATFORM_ADMIN) {
      const userMuni = request.user.municipalityId;
      if (!userMuni || (existing.municipality_id || '').toLowerCase() !== userMuni.toLowerCase()) {
        throw new ForbiddenException('Access denied to update payments outside your municipality');
      }
    }
    return this.paymentsService.update(id, updateDto);
  }

  @Post(':id/verify')
  @Roles(Role.DEPARTMENT_OFFICER, Role.SUPER_USER, Role.PLATFORM_ADMIN)
  @ApiRoute({
    summary: 'Verify payment',
    roles: [Role.DEPARTMENT_OFFICER, Role.SUPER_USER, Role.PLATFORM_ADMIN],
    params: [{ name: 'id', description: 'Payment ID' }],
    bodyType: VerifyPaymentDto,
    status: 201,
    responseExample: { payment_id: 1, payment_status: 'completed', transaction_id: 'TXN-...' },
  })
  verifyPayment(
    @Param('id', ParseIntPipe) id: number,
    @Body() verifyDto: VerifyPaymentDto,
    @Req() request: Request & { user: AuthenticatedUser },
  ) {
    const existing = this.paymentsService.findOne(id);
    if (request.user.role !== Role.PLATFORM_ADMIN) {
      const userMuni = request.user.municipalityId;
      if (!userMuni || (existing.municipality_id || '').toLowerCase() !== userMuni.toLowerCase()) {
        throw new ForbiddenException('Access denied to verify payments outside your municipality');
      }
    }
    return this.paymentsService.verifyPayment(
      id,
      verifyDto.transaction_id,
      verifyDto.is_successful,
    );
  }

  @Delete(':id')
  @Roles(Role.DEPARTMENT_OFFICER, Role.SUPER_USER, Role.PLATFORM_ADMIN)
  @ApiRoute({
    summary: 'Delete payment by ID',
    roles: [Role.DEPARTMENT_OFFICER, Role.SUPER_USER, Role.PLATFORM_ADMIN],
    params: [{ name: 'id', description: 'Payment ID' }],
    responseExample: true,
  })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: Request & { user: AuthenticatedUser },
  ) {
    const existing = this.paymentsService.findOne(id);
    if (request.user.role !== Role.PLATFORM_ADMIN) {
      const userMuni = request.user.municipalityId;
      if (!userMuni || (existing.municipality_id || '').toLowerCase() !== userMuni.toLowerCase()) {
        throw new ForbiddenException('Access denied to delete payments outside your municipality');
      }
    }
    return this.paymentsService.remove(id);
  }
}
