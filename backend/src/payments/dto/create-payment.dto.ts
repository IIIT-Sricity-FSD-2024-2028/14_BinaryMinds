import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { PaymentStatus } from '../../common/enums/payment-status.enum';

export class CreatePaymentDto {
  @IsNumber()
  @IsNotEmpty()
  application_id!: number;

  @IsString()
  @IsOptional()
  municipality_id?: string;

  @IsNumber()
  @IsNotEmpty()
  amount!: number;

  @IsNumber()
  @IsOptional()
  processing_fee?: number;

  @IsNumber()
  @IsOptional()
  platform_fee?: number;

  @IsNumber()
  @IsOptional()
  service_tax?: number;

  @IsEnum(PaymentStatus)
  @IsOptional()
  payment_status?: PaymentStatus;

  @IsString()
  @IsOptional()
  transaction_id?: string;
}
