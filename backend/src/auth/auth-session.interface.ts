import { Role } from '../common/enums/role.enum';

export interface AuthenticatedUser {
  userId: number;
  email: string;
  role: Role;
  fullName: string;
  municipalityId?: string;
}

export interface AuthSession extends AuthenticatedUser {
  token: string;
  expiresAt: Date;
}
