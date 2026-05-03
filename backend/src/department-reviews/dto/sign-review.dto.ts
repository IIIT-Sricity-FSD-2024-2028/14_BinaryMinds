import { IsNotEmpty, IsString } from 'class-validator';

export class SignReviewDto {
  @IsString()
  @IsNotEmpty()
  digital_signature!: string;
}
