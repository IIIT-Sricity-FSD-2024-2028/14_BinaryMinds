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
import { PlatformAdminService } from '../platform-admin/platform-admin.service';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly repository: PaymentsRepository,
    private readonly applicationsService: ApplicationsService,
    private readonly platformAdminService: PlatformAdminService,
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
    const app = this.applicationsService.findOne(data.application_id);
    if (!app.municipality_id) {
      throw new BadRequestException('Application is missing municipality_id');
    }
    if (
      data.municipality_id &&
      data.municipality_id.toLowerCase() !== app.municipality_id.toLowerCase()
    ) {
      throw new BadRequestException('Payment municipality does not match application municipality');
    }
    const municipalityId = app.municipality_id;
    const settings = this.platformAdminService.settings();

    const processingFee = data.processing_fee ?? settings.default_base_processing_fee ?? 1200;
    const platformFee = data.platform_fee ?? settings.default_platform_fee ?? 250;
    const serviceTax = data.service_tax ?? Math.round((processingFee * (settings.default_service_tax_percentage ?? 5)) / 100);
    const totalAmount = data.amount || (processingFee + platformFee + serviceTax);

    const transactionId = data.transaction_id || `TXN-${crypto.randomUUID()}`;

    const createData = {
      ...data,
      amount: totalAmount,
      processing_fee: processingFee,
      platform_fee: platformFee,
      service_tax: serviceTax,
      municipality_id: municipalityId,
      payment_status: data.payment_status || PaymentStatus.PENDING,
      transaction_id: transactionId,
    };
    const payment = this.repository.create(createData);
    if (payment.payment_status === PaymentStatus.COMPLETED) {
      this.applicationsService.update(payment.application_id, { paymentDone: true });
      this.platformAdminService.recordCompletedPayment(payment);
    }
    return payment;
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
    if (updated.payment_status === PaymentStatus.COMPLETED) {
      this.applicationsService.update(updated.application_id, { paymentDone: true });
      this.platformAdminService.recordCompletedPayment(updated);
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

    if (updated.payment_status === PaymentStatus.COMPLETED) {
      this.applicationsService.update(updated.application_id, { paymentDone: true });
      this.platformAdminService.recordCompletedPayment(updated);
    }

    return updated;
  }

  remove(id: number): void {
    this.findOne(id);
    this.repository.delete(id);
  }
}
