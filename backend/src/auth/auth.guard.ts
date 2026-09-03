import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { IS_PUBLIC_KEY } from '../common/decorators/public.decorator';
import { Role } from '../common/enums/role.enum';
import { AuthenticatedUser } from './auth-session.interface';

interface JwtPayload {
  sub: number;
  role: Role;
  email: string;
  fullName: string;
  municipalityId?: string;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const authorization = request.headers.authorization;
    if (typeof authorization !== 'string') {
      throw new UnauthorizedException('Bearer access token is required');
    }

    const match = /^Bearer (.+)$/.exec(authorization);
    if (!match) {
      throw new UnauthorizedException('Bearer access token is required');
    }

    try {
      const payload = this.jwtService.verify<JwtPayload>(match[1]);
      request.user = {
        userId: payload.sub,
        email: payload.email,
        role: payload.role,
        fullName: payload.fullName,
        municipalityId: payload.municipalityId,
      } satisfies AuthenticatedUser;
    } catch {
      throw new UnauthorizedException('Invalid or expired access token');
    }
    return true;
  }
}
