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
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Role } from '../common/enums/role.enum';
import { ApiTags } from '@nestjs/swagger';
import { ApiRoute } from '../common/swagger/api-route.decorator';

@ApiTags('Payments')
@Controller('payments')
@UseGuards(RolesGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @Roles(Role.APPLICANT, Role.DEPARTMENT_OFFICER)
  @ApiRoute({
    summary: 'Create payment',
    roles: [Role.APPLICANT, Role.DEPARTMENT_OFFICER],
    bodyType: CreatePaymentDto,
    status: 201,
    responseExample: { payment_id: 1, payment_status: 'pending', transaction_id: 'TXN-...' },
  })
  create(@Body() createDto: CreatePaymentDto) {
    return this.paymentsService.create(createDto);
  }

  @Get()
  @Roles(Role.DEPARTMENT_OFFICER, Role.FIELD_OFFICER)
  @ApiRoute({
    summary: 'List payments',
    roles: [Role.DEPARTMENT_OFFICER, Role.FIELD_OFFICER],
    responseExample: [{ payment_id: 1, application_id: 1, payment_status: 'pending' }],
  })
  findAll() {
    return this.paymentsService.findAll();
  }

  @Get('application/:applicationId')
  @Roles(Role.APPLICANT, Role.DEPARTMENT_OFFICER, Role.FIELD_OFFICER)
  @ApiRoute({
    summary: 'List payments by application',
    roles: [Role.APPLICANT, Role.DEPARTMENT_OFFICER, Role.FIELD_OFFICER],
    params: [{ name: 'applicationId', description: 'Application ID' }],
    responseExample: [{ payment_id: 1, application_id: 1 }],
  })
  findByApplication(
    @Param('applicationId', ParseIntPipe) applicationId: number,
  ) {
    return this.paymentsService.findByApplication(applicationId);
  }

  @Get(':id')
  @Roles(Role.APPLICANT, Role.DEPARTMENT_OFFICER, Role.FIELD_OFFICER)
  @ApiRoute({
    summary: 'Get payment by ID',
    roles: [Role.APPLICANT, Role.DEPARTMENT_OFFICER, Role.FIELD_OFFICER],
    params: [{ name: 'id', description: 'Payment ID' }],
    responseExample: { payment_id: 1, payment_status: 'pending' },
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.paymentsService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.DEPARTMENT_OFFICER, Role.APPLICANT)
  @ApiRoute({
    summary: 'Update payment by ID',
    roles: [Role.DEPARTMENT_OFFICER, Role.APPLICANT],
    params: [{ name: 'id', description: 'Payment ID' }],
    bodyType: UpdatePaymentDto,
    responseExample: { payment_id: 1, payment_status: 'completed' },
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdatePaymentDto,
  ) {
    return this.paymentsService.update(id, updateDto);
  }

  @Post(':id/verify')
  @Roles(Role.DEPARTMENT_OFFICER)
  @ApiRoute({
    summary: 'Verify payment',
    roles: [Role.DEPARTMENT_OFFICER],
    params: [{ name: 'id', description: 'Payment ID' }],
    bodyType: VerifyPaymentDto,
    status: 201,
    responseExample: { payment_id: 1, payment_status: 'completed', transaction_id: 'TXN-...' },
  })
  verifyPayment(
    @Param('id', ParseIntPipe) id: number,
    @Body() verifyDto: VerifyPaymentDto,
  ) {
    return this.paymentsService.verifyPayment(
      id,
      verifyDto.transaction_id,
      verifyDto.is_successful,
    );
  }

  @Delete(':id')
  @Roles(Role.DEPARTMENT_OFFICER)
  @ApiRoute({
    summary: 'Delete payment by ID',
    roles: [Role.DEPARTMENT_OFFICER],
    params: [{ name: 'id', description: 'Payment ID' }],
    responseExample: true,
  })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.paymentsService.remove(id);
  }
}
