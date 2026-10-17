import { IsEmail, IsNotEmpty, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class RegisterApplicantDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @MinLength(3)
  @Matches(/^[A-Za-z]+(?: +[A-Za-z]+)+$/, {
    message: 'Full name must contain at least two name parts using English letters and spaces only',
  })
  full_name!: string;

  @IsEmail()
  @IsNotEmpty()
  @MaxLength(120)
  email!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(15)
  phone!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(255)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/, {
    message: 'Password must include at least one letter, one number, and one special character',
  })
  password!: string;
}
