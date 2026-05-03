import { Role } from '../common/enums/role.enum';

export interface User {
  user_id: number;
  full_name: string;
  email: string;
  phone: string;
  password_hash: string;
  role: Role;
  created_at?: Date;
}
