import { Payment } from './payment.interface';
export declare class PaymentsRepository {
    private payments;
    private idCounter;
    find(): Payment[];
    findById(id: number): Payment | undefined;
    findByApplication(applicationId: number): Payment[];
    create(payment: Omit<Payment, 'payment_id' | 'payment_date'>): Payment;
    update(id: number, updateData: Partial<Payment>): Payment | undefined;
    delete(id: number): boolean;
}
