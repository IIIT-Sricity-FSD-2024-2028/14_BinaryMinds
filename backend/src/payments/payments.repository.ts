import { Injectable } from '@nestjs/common';
import { Payment } from './payment.interface';
import { PaymentStatus } from '../common/enums/payment-status.enum';

@Injectable()
export class PaymentsRepository {
  private payments: Payment[] = [];
  private idCounter = 1;

  find(): Payment[] {
    return this.payments;
  }

  findById(id: number): Payment | undefined {
    return this.payments.find((p) => p.payment_id === id);
  }

  findByApplication(applicationId: number): Payment[] {
    return this.payments.filter((p) => p.application_id === applicationId);
  }

  create(payment: Omit<Payment, 'payment_id' | 'payment_date'>): Payment {
    const newPayment: Payment = {
      ...payment,
      payment_id: this.idCounter++,
      payment_date: new Date(),
    };
    if (!newPayment.payment_status) {
      newPayment.payment_status = PaymentStatus.PENDING;
    }
    this.payments.push(newPayment);
    return newPayment;
  }

  update(id: number, updateData: Partial<Payment>): Payment | undefined {
    const index = this.payments.findIndex((p) => p.payment_id === id);
    if (index === -1) return undefined;

    this.payments[index] = { ...this.payments[index], ...updateData };
    return this.payments[index];
  }

  delete(id: number): boolean {
    const initialLength = this.payments.length;
    this.payments = this.payments.filter((p) => p.payment_id !== id);
    return this.payments.length !== initialLength;
  }
}
