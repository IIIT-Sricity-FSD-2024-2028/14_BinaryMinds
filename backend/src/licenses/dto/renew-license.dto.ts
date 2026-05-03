import { IsNotEmpty, IsDateString } from 'class-validator';

export class RenewLicenseDto {
  @IsDateString()
  @IsNotEmpty()
  new_expiry_date!: Date;
}
