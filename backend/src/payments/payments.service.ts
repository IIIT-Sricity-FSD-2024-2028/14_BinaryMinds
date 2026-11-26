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
    if (Object.prototype.hasOwnProperty.call(data, 'payment_status')) {
      throw new BadRequestException(
        'Payment status is assigned by the server; use the explicit simulated-payment action to complete a payment.',
      );
    }
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
    const existingPayments = this.repository.findByApplication(data.application_id);
    if (
      app.paymentDone === true ||
      existingPayments.some((payment) => payment.payment_status === PaymentStatus.COMPLETED)
    ) {
      throw new BadRequestException('A completed payment already exists for this application');
    }
    if (existingPayments.some((payment) => payment.payment_status === PaymentStatus.PENDING)) {
      throw new BadRequestException('A pending payment already exists for this application');
    }
    const municipalityId = app.municipality_id;
    const settings = this.platformAdminService.settings();

    const processingFee = data.processing_fee ?? settings.default_base_processing_fee ?? 1200;
    const platformFee = data.platform_fee ?? settings.default_platform_fee ?? 250;
    const serviceTax =
      data.service_tax ??
      Math.round((processingFee * (settings.default_service_tax_percentage ?? 5)) / 100);
    const totalAmount = data.amount || processingFee + platformFee + serviceTax;

    const transactionId = data.transaction_id || `TXN-${crypto.randomUUID()}`;

    const createData = {
      ...data,
      amount: totalAmount,
      processing_fee: processingFee,
      platform_fee: platformFee,
      service_tax: serviceTax,
      municipality_id: municipalityId,
      payment_status: PaymentStatus.PENDING,
      transaction_id: transactionId,
    };
    return this.repository.create(createData);
  }

  simulateApplicantPayment(data: CreatePaymentDto): Payment {
    if (Object.prototype.hasOwnProperty.call(data, 'payment_status')) {
      throw new BadRequestException('The simulated-payment action controls the payment status.');
    }
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
    if (app.paymentDone === true) {
      throw new BadRequestException('This application is already marked as paid');
    }

    const existing = this.repository.findByApplication(data.application_id);
    if (existing.some((payment) => payment.payment_status === PaymentStatus.COMPLETED)) {
      throw new BadRequestException('A completed payment already exists for this application');
    }
    let payment = existing.find((item) => item.payment_status === PaymentStatus.PENDING);
    if (!payment) {
      payment = this.create(data);
    } else if (data.payment_method) {
      payment = this.repository.update(payment.payment_id, { payment_method: data.payment_method }) || payment;
    }
    return this.completePendingPayment(payment.payment_id);
  }

  update(id: number, updateData: Partial<Payment>): Payment {
    const existing = this.findOne(id);

    if (String(updateData.payment_status || '').toUpperCase() === String(PaymentStatus.COMPLETED)) {
      throw new BadRequestException(
        'Payments can only be completed through an authorized verification or explicit simulation action',
      );
    }
    
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

    if (isSuccessful) return this.completePendingPayment(id, transactionId || existing.transaction_id);
    
    const updated = this.repository.update(id, {
      payment_status: PaymentStatus.FAILED,
      transaction_id: transactionId || existing.transaction_id,
      payment_date: new Date(),
    });
    
    if (!updated) {
       throw new NotFoundException(`Payment with ID ${id} not found`);
    }

    return updated;
  }

  private completePendingPayment(id: number, transactionId?: string): Payment {
    const existing = this.findOne(id);
    if (existing.payment_status !== PaymentStatus.PENDING) {
      throw new BadRequestException('Only a PENDING payment can be completed');
    }
    const updated = this.repository.update(id, {
      payment_status: PaymentStatus.COMPLETED,
      transaction_id: transactionId || existing.transaction_id,
      payment_date: new Date(),
    });
    if (!updated) throw new NotFoundException(`Payment with ID ${id} not found`);

    this.applicationsService.markPaymentCompleted(updated.application_id);
    this.platformAdminService.recordCompletedPayment(updated);
    return updated;
  }

  remove(id: number): void {
    this.findOne(id);
    this.repository.delete(id);
  }
}
