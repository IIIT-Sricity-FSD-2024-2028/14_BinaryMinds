import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class VerifyPaymentDto {
  @IsString()
  @IsOptional()
  transaction_id?: string;

  @IsBoolean()
  @IsNotEmpty()
  is_successful!: boolean;
}
