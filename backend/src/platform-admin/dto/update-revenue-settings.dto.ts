import { IsInt, IsNumber, IsOptional, Max, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateRevenueSettingsDto {
  @ApiProperty({ description: 'TradeZo revenue percentage share (0-100)', example: 20, required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  tradezo_revenue_percentage?: number;

  @ApiProperty({ description: 'Default base processing fee in INR', example: 1200, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  default_base_processing_fee?: number;

  @ApiProperty({ description: 'Default platform fee in INR', example: 250, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  default_platform_fee?: number;

  @ApiProperty({ description: 'Default service tax percentage', example: 5, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  default_service_tax_percentage?: number;
}
