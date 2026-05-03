import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { PaymentStatus } from '../../common/enums/payment-status.enum';

export class CreatePaymentDto {
  @IsNumber()
  @IsNotEmpty()
  application_id!: number;

  @IsNumber()
  @IsNotEmpty()
  amount!: number;

  @IsEnum(PaymentStatus)
  @IsOptional()
  payment_status?: PaymentStatus;

  @IsString()
  @IsOptional()
  transaction_id?: string;
}
