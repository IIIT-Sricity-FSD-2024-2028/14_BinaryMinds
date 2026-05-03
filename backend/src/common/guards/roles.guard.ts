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
    const userRole = request.headers['role'];

    if (!userRole) {
      throw new ForbiddenException('Role header is missing');
    }

    if (!requiredRoles.includes(userRole as Role)) {
      throw new ForbiddenException('You do not have access to this resource');
    }

    return true;
  }
}
