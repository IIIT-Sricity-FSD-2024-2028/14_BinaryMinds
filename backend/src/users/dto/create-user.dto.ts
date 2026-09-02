import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Role } from '../../common/enums/role.enum';

export class CreateUserDto {
  @IsOptional()
  @IsString()
  municipality_id?: string;

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

  @IsOptional()
  @IsString()
  @MaxLength(30)
  employee_id?: string;

  @IsOptional()
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  @MaxLength(255)
  password_hash?: string;

  @IsOptional()
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  @MaxLength(255)
  password?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  replace?: boolean;

  @IsOptional()
  @IsEnum(Role, { message: 'Role must be a valid enum value' })
  role?: Role;
}
