import { PaymentStatus } from '../../common/enums/payment-status.enum';
export declare class CreatePaymentDto {
    application_id: number;
    amount: number;
    payment_status?: PaymentStatus;
    transaction_id?: string;
}
