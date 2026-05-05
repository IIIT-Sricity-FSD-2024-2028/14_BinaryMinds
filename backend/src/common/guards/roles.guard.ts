import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../enums/role.enum';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  /**
   * Normalize common role aliases sent via the `role` header
   * so frontend can send either "superuser" or "super_user", etc.
   */
  private normalizeRole(raw: string): string {
    const map: Record<string, string> = {
      superuser: Role.SUPER_USER,
      super_user: Role.SUPER_USER,
      officer: Role.FIELD_OFFICER,
      field_officer: Role.FIELD_OFFICER,
      applicant: Role.APPLICANT,
      department_officer: Role.DEPARTMENT_OFFICER,
    };
    return map[raw.toLowerCase()] || raw;
  }

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    
    // If no roles are strictly required by the decorator, allow access
    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    // According to Review-4 requirements, read Role directly from header
    const rawRole = request.headers['role'];

    if (!rawRole) {
      throw new ForbiddenException('Role header is missing');
    }

    const userRole = this.normalizeRole(rawRole);

    if (!requiredRoles.includes(userRole as Role)) {
      throw new ForbiddenException('You do not have access to this resource');
    }

    return true;
  }
}
