import { IsNotEmpty, IsNumber, IsDateString } from 'class-validator';

export class CreateLicenseDto {
  @IsNumber()
  @IsNotEmpty()
  application_id!: number;

  @IsNumber()
  @IsNotEmpty()
  issued_by!: number;

  @IsDateString()
  @IsNotEmpty()
  expiry_date!: Date;
}
