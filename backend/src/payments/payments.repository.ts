import { Injectable } from '@nestjs/common';
import { Payment } from './payment.interface';
import { PaymentStatus } from '../common/enums/payment-status.enum';
import { JsonStore } from '../common/persistence/json-store';

@Injectable()
export class PaymentsRepository {
  constructor(private readonly store: JsonStore) {}

  find(): Payment[] {
    return this.store.snapshot().payments;
  }

  findById(id: number): Payment | undefined {
    return this.find().find((p) => p.payment_id === id);
  }

  findByApplication(applicationId: number): Payment[] {
    return this.find().filter((p) => p.application_id === applicationId);
  }

  create(payment: Omit<Payment, 'payment_id' | 'payment_date'>): Payment {
    const newPayment: Payment = {
      ...payment,
      payment_id: this.store.snapshot().counters.payments++,
      payment_date: new Date(),
    };
    if (!newPayment.payment_status) {
      newPayment.payment_status = PaymentStatus.PENDING;
    }
    this.find().push(newPayment);
    this.store.save();
    return newPayment;
  }

  update(id: number, updateData: Partial<Payment>): Payment | undefined {
    const payments = this.find();
    const index = payments.findIndex((p) => p.payment_id === id);
    if (index === -1) return undefined;

    const cleanedUpdates: Partial<Payment> = {};
    for (const key of Object.keys(updateData) as (keyof Payment)[]) {
      if (updateData[key] !== undefined) {
        (cleanedUpdates as any)[key] = updateData[key];
      }
    }

    payments[index] = { ...payments[index], ...cleanedUpdates };
    this.store.save();
    return payments[index];
  }

  delete(id: number): boolean {
    const payments = this.find();
    const initialLength = payments.length;
    const remaining = payments.filter((p) => p.payment_id !== id);
    if (remaining.length === initialLength) return false;
    payments.splice(0, payments.length, ...remaining);
    this.store.save();
    return true;
  }
}
