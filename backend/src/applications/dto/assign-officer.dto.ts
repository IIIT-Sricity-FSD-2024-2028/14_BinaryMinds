import { IsNumber, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignOfficerDto {
  @ApiProperty({ description: 'Officer User ID to assign', example: 2, required: false })
  @IsOptional()
  @IsNumber()
  officerId?: number;
}
