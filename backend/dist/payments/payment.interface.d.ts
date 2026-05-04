import { PaymentStatus } from '../common/enums/payment-status.enum';
export interface Payment {
    payment_id: number;
    application_id: number;
    amount: number;
    payment_status: PaymentStatus;
    transaction_id?: string;
    payment_date?: Date;
}
