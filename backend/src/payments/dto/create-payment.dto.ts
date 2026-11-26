import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

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

  @IsString()
  @IsOptional()
  payment_method?: string;

  @IsString()
  @IsOptional()
  transaction_id?: string;
}
