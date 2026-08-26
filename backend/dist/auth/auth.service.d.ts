import { Role } from '../common/enums/role.enum';
import { UsersService } from '../users/users.service';
import { AuthenticatedUser } from './auth-session.interface';
import { LoginDto } from './dto/login.dto';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
export declare class AuthService {
    private readonly usersService;
    private readonly auditLogsService;
    private readonly sessions;
    private readonly sessionTtlMs;
    constructor(usersService: UsersService, auditLogsService: AuditLogsService);
    login(credentials: LoginDto): {
        accessToken: string;
        user: {
            user_id: number;
            full_name: string;
            email: string;
            phone: string;
            role: Role;
        };
    };
    validateToken(token: string): AuthenticatedUser;
    private createSession;
    private passwordMatches;
    private normalizeRole;
    private getSessionTtlMs;
}
