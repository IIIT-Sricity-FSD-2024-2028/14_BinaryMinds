import { IsInt, Max, Min } from 'class-validator';

export class UpdateRevenueSettingsDto {
  @IsInt()
  @Min(0)
  @Max(100)
  tradezo_revenue_percentage!: number;
}
