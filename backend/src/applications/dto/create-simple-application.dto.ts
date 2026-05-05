import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSimpleApplicationDto {
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

  @ApiProperty({ description: 'Applicant phone number', example: '9876543210', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  phone?: string;
}
