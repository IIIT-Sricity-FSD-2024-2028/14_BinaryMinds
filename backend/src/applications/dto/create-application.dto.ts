import {
  IsString,
  IsOptional,
  IsNumber,
  MaxLength,
  IsDateString,
} from 'class-validator';

export class CreateApplicationDto {
  @IsString()
  @IsOptional()
  municipality_id?: string;

  @IsString()
  @IsOptional()
  municipalityId?: string;

  @IsString()
  @IsOptional()
  municipalityName?: string;

  @IsNumber()
  @IsOptional()
  applicant_id?: number;

  @IsString()
  @IsOptional()
  @MaxLength(120)
  applicantName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(120)
  full_name?: string;

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
  @MaxLength(20)
  applicant_phone?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  phone?: string;

  @IsString()
  @IsOptional()
  @MaxLength(150)
  business_name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(150)
  businessName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  business_type?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  businessType?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  trade_category?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  tradeCategory?: string;

  @IsString()
  @IsOptional()
  shop_address?: string;

  @IsString()
  @IsOptional()
  shopAddress?: string;

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
  @MaxLength(100)
  pincode?: string;

  @IsDateString()
  @IsOptional()
  business_start_date?: string;
}
