import { Injectable, UnauthorizedException } from '@nestjs/common';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { Role } from '../common/enums/role.enum';
import { User } from '../users/user.interface';
import { UsersService } from '../users/users.service';
import { AuthenticatedUser, AuthSession } from './auth-session.interface';
import { LoginDto } from './dto/login.dto';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

const DEFAULT_SESSION_TTL_MS = 8 * 60 * 60 * 1000;

@Injectable()
export class AuthService {
  private readonly sessions = new Map<string, AuthSession>();
  private readonly sessionTtlMs = this.getSessionTtlMs();

  constructor(
    private readonly usersService: UsersService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  login(credentials: LoginDto) {
    let user: User;
    const requestedRole = this.normalizeRole(credentials.role);
    if (!requestedRole) {
      throw new UnauthorizedException('Invalid email, password, or role');
    }
    if (requestedRole === Role.PLATFORM_ADMIN) {
      user = this.platformAdminUser(credentials);
    } else {
      try {
        user = this.usersService.findByEmail(credentials.email.trim().toLowerCase());
      } catch {
        throw new UnauthorizedException('Invalid email, password, or role');
      }
      if (user.role !== requestedRole || !this.passwordMatches(credentials.password, user.password_hash)) {
        throw new UnauthorizedException('Invalid email, password, or role');
      }
    }

    const session = this.createSession(user);
    this.auditLogsService.log({
      user_name: user.full_name,
      role: user.role,
      action: 'Login',
      module: 'Authentication',
      description: 'Login successful',
      ip_address: 'server',
      source: 'backend',
    });
    return {
      accessToken: session.token,
      user: {
        user_id: user.user_id,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    };
  }

  validateToken(token: string): AuthenticatedUser {
    const session = this.sessions.get(token);
    if (!session || session.expiresAt.getTime() <= Date.now()) {
      if (session) this.sessions.delete(token);
      throw new UnauthorizedException('Invalid or expired access token');
    }

    return {
      userId: session.userId,
      email: session.email,
      role: session.role,
      fullName: session.fullName,
    };
  }

  private createSession(user: User): AuthSession {
    const token = randomBytes(32).toString('base64url');
    const session: AuthSession = {
      token,
      userId: user.user_id,
      email: user.email,
      role: user.role,
      fullName: user.full_name,
      expiresAt: new Date(Date.now() + this.sessionTtlMs),
    };
    this.sessions.set(token, session);
    return session;
  }

  private passwordMatches(password: string, storedPassword: string): boolean {
    const supplied = Buffer.from(password);
    const stored = Buffer.from(storedPassword);
    return supplied.length === stored.length && timingSafeEqual(supplied, stored);
  }

  private normalizeRole(value: string): Role | null {
    const normalized = value.trim().toLowerCase().replace(/[\s-]+/g, '_');
    const aliases: Record<string, Role> = {
      applicant: Role.APPLICANT,
      field_officer: Role.FIELD_OFFICER,
      fieldofficer: Role.FIELD_OFFICER,
      officer: Role.FIELD_OFFICER,
      department_officer: Role.DEPARTMENT_OFFICER,
      departmentofficer: Role.DEPARTMENT_OFFICER,
      municipal_commissioner: Role.MUNICIPAL_COMMISSIONER,
      municipalcommissioner: Role.MUNICIPAL_COMMISSIONER,
      platform_admin: Role.PLATFORM_ADMIN,
      platformadmin: Role.PLATFORM_ADMIN,
    };
    return aliases[normalized] ?? null;
  }

  private platformAdminUser(credentials: LoginDto): User {
    const email = process.env.PLATFORM_ADMIN_EMAIL?.trim().toLowerCase();
    const password = process.env.PLATFORM_ADMIN_PASSWORD;
    if (!email || !password || credentials.email.trim().toLowerCase() !== email || !this.passwordMatches(credentials.password, password)) {
      throw new UnauthorizedException('Invalid email, password, or role');
    }
    return { user_id: 0, full_name: 'TradeZo Platform Admin', email, phone: '', password_hash: password, role: Role.PLATFORM_ADMIN };
  }

  private getSessionTtlMs(): number {
    const configuredValue = Number(process.env.AUTH_SESSION_TTL_MS);
    return Number.isSafeInteger(configuredValue) && configuredValue > 0
      ? configuredValue
      : DEFAULT_SESSION_TTL_MS;
  }
}
