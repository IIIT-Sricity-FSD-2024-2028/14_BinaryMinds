import { Role } from '../common/enums/role.enum';

export interface User {
  user_id: number;
  municipality_id?: string;
  full_name: string;
  email: string;
  phone: string;
  employee_id?: string;
  password_hash: string;
  role: Role;
  status?: string;
  department?: string;
  created_at?: Date;
}
