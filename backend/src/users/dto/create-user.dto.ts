import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Role } from '../../common/enums/role.enum';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
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
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  @MaxLength(255)
  password_hash!: string;

  @IsEnum(Role, { message: 'Role must be a valid enum value' })
  @IsNotEmpty()
  role!: Role;
}
