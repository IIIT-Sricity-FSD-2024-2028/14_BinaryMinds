import { Payment } from './payment.interface';
import { JsonStore } from '../common/persistence/json-store';
export declare class PaymentsRepository {
    private readonly store;
    constructor(store: JsonStore);
    find(): Payment[];
    findById(id: number): Payment | undefined;
    findByApplication(applicationId: number): Payment[];
    create(payment: Omit<Payment, 'payment_id' | 'payment_date'>): Payment;
    update(id: number, updateData: Partial<Payment>): Payment | undefined;
    delete(id: number): boolean;
}
