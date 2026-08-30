import { IsNotEmpty, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  @Matches(/^([^\s@]+@[^\s@]+\.[^\s@]+|\d{10})$/, {
    message: 'Enter a valid email address or 10-digit phone number',
  })
  email!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(255)
  password!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  role!: string;
}
