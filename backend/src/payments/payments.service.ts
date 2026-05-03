import * as crypto from 'crypto';
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PaymentsRepository } from './payments.repository';
import { Payment } from './payment.interface';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentStatus } from '../common/enums/payment-status.enum';
import { ApplicationsService } from '../applications/applications.service';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly repository: PaymentsRepository,
    private readonly applicationsService: ApplicationsService,
  ) {}

  findAll(): Payment[] {
    return this.repository.find();
  }

  findOne(id: number): Payment {
    const payment = this.repository.findById(id);
    if (!payment) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }
    return payment;
  }

  findByApplication(applicationId: number): Payment[] {
    return this.repository.findByApplication(applicationId);
  }

  create(data: CreatePaymentDto): Payment {
    this.applicationsService.findOne(data.application_id);

    const transactionId = data.transaction_id || `TXN-${crypto.randomUUID()}`;

    const createData = {
      ...data,
      payment_status: data.payment_status || PaymentStatus.PENDING,
      transaction_id: transactionId,
    };
    return this.repository.create(createData);
  }

  update(id: number, updateData: Partial<Payment>): Payment {
    const existing = this.findOne(id);
    
    // Payment status logic: Prevent invalid state transitions
    if (
      existing.payment_status === PaymentStatus.COMPLETED &&
      updateData.payment_status &&
      updateData.payment_status !== PaymentStatus.COMPLETED && 
      updateData.payment_status !== PaymentStatus.REFUNDED
    ) {
      throw new BadRequestException('Cannot change status of a COMPLETED payment except to REFUNDED');
    }

    if (existing.payment_status === PaymentStatus.REFUNDED) {
       throw new BadRequestException('Cannot modify a REFUNDED payment');
    }

    const updated = this.repository.update(id, updateData);
    if (!updated) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }
    return updated;
  }

  verifyPayment(id: number, transactionId: string | undefined, isSuccessful: boolean): Payment {
    const existing = this.findOne(id);
    if (existing.payment_status !== PaymentStatus.PENDING) {
      throw new BadRequestException('Can only verify PENDING payments');
    }

    const newStatus = isSuccessful ? PaymentStatus.COMPLETED : PaymentStatus.FAILED;
    
    const updated = this.repository.update(id, {
      payment_status: newStatus,
      transaction_id: transactionId || existing.transaction_id,
      payment_date: new Date(),
    });
    
    if (!updated) {
       throw new NotFoundException(`Payment with ID ${id} not found`);
    }

    return updated;
  }

  remove(id: number): void {
    this.findOne(id);
    this.repository.delete(id);
  }
}
