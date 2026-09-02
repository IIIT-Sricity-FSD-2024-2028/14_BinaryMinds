import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateMunicipalityDto {
  @IsString()
  municipality_id!: string;

  @IsString()
  name!: string;

  @IsString()
  state!: string;

  @IsString()
  district!: string;

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

  @IsOptional()
  @IsString()
  head_name?: string;

  @IsOptional()
  @IsString()
  head_email?: string;

  @IsOptional()
  @IsString()
  head_phone?: string;
}
