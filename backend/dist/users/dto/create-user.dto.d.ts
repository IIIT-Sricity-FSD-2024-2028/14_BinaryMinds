import { Role } from '../../common/enums/role.enum';
export declare class CreateUserDto {
    full_name: string;
    email: string;
    phone: string;
    password_hash: string;
    role: Role;
}
