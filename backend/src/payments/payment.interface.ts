import { PaymentStatus } from '../common/enums/payment-status.enum';

export interface Payment {
  payment_id: number;
  application_id: number;
  municipality_id?: string;
  amount: number;
  processing_fee?: number;
  platform_fee?: number;
  service_tax?: number;
  payment_status: PaymentStatus;
  transaction_id?: string;
  payment_date?: Date;
}
