import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  MaxLength,
  IsDateString,
} from 'class-validator';

export class CreateApplicationDto {
  @IsNumber()
  @IsNotEmpty()
  applicant_id!: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  full_name!: string;

  @IsString()
  @IsOptional()
  @MaxLength(120)
  father_name?: string;

  @IsDateString()
  @IsOptional()
  date_of_birth?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  gender?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  aadhaar_number?: string;

  @IsString()
  @IsOptional()
  @MaxLength(15)
  applicant_phone?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  business_name!: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  business_type?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  trade_category?: string;

  @IsString()
  @IsOptional()
  shop_address?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  city?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  district?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  state?: string;

  @IsString()
  @IsOptional()
  @MaxLength(10)
  pincode?: string;

  @IsDateString()
  @IsOptional()
  business_start_date?: string;
}
