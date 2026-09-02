import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpdateMunicipalityDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  district?: string;

  @IsOptional()
  @IsEnum(['active', 'inactive'])
  status?: 'active' | 'inactive';

  @IsOptional()
  @IsNumber()
  @Min(0)
  base_processing_fee?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  platform_fee?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  service_tax_percentage?: number;
}
