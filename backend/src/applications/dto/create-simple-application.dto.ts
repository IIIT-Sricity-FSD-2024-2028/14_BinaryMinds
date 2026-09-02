import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSimpleApplicationDto {
  @ApiProperty({ description: 'Target Municipality Corporation ID', example: 'muni-hyd', required: false })
  @IsString()
  @IsOptional()
  municipality_id?: string;

  @IsString()
  @IsOptional()
  municipalityId?: string;

  @IsString()
  @IsOptional()
  municipalityName?: string;

  @ApiProperty({ description: 'Full name of the applicant', example: 'Applicant Name' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  applicantName!: string;

  @ApiProperty({ description: 'Business name', example: 'Registered Business Name', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(160)
  businessName?: string;

  @ApiProperty({ description: 'Business type', example: 'Retail', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  businessType?: string;

  @ApiProperty({ description: 'Trade category', example: 'Retail', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(120)
  tradeCategory?: string;

  @ApiProperty({ description: 'Shop or business address', example: 'Registered business address', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(240)
  shopAddress?: string;

  @ApiProperty({ description: 'City', example: 'Hyderabad', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  city?: string;

  @ApiProperty({ description: 'District', example: 'Hyderabad', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  district?: string;

  @ApiProperty({ description: 'State', example: 'Telangana', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  state?: string;

  @ApiProperty({ description: 'Pincode', example: '500001', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  pincode?: string;

  @ApiProperty({ description: 'Applicant phone number', example: '9876543210', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  phone?: string;
}

