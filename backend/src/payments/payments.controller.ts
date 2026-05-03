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

@ApiTags('Payments')
@Controller('payments')
@UseGuards(RolesGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @Roles(Role.APPLICANT, Role.DEPARTMENT_OFFICER)
  create(@Body() createDto: CreatePaymentDto) {
    return this.paymentsService.create(createDto);
  }

  @Get()
  @Roles(Role.DEPARTMENT_OFFICER, Role.FIELD_OFFICER)
  findAll() {
    return this.paymentsService.findAll();
  }

  @Get('application/:applicationId')
  @Roles(Role.APPLICANT, Role.DEPARTMENT_OFFICER, Role.FIELD_OFFICER)
  findByApplication(
    @Param('applicationId', ParseIntPipe) applicationId: number,
  ) {
    return this.paymentsService.findByApplication(applicationId);
  }

  @Get(':id')
  @Roles(Role.APPLICANT, Role.DEPARTMENT_OFFICER, Role.FIELD_OFFICER)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.paymentsService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.DEPARTMENT_OFFICER, Role.APPLICANT)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdatePaymentDto,
  ) {
    return this.paymentsService.update(id, updateDto);
  }

  @Post(':id/verify')
  @Roles(Role.DEPARTMENT_OFFICER)
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
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.paymentsService.remove(id);
  }
}
