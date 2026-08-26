"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const node_crypto_1 = require("node:crypto");
const role_enum_1 = require("../common/enums/role.enum");
const users_service_1 = require("../users/users.service");
const audit_logs_service_1 = require("../audit-logs/audit-logs.service");
const DEFAULT_SESSION_TTL_MS = 8 * 60 * 60 * 1000;
let AuthService = class AuthService {
    usersService;
    auditLogsService;
    sessions = new Map();
    sessionTtlMs = this.getSessionTtlMs();
    constructor(usersService, auditLogsService) {
        this.usersService = usersService;
        this.auditLogsService = auditLogsService;
    }
    login(credentials) {
        let user;
        try {
            user = this.usersService.findByEmail(credentials.email.trim().toLowerCase());
        }
        catch {
            throw new common_1.UnauthorizedException('Invalid email, password, or role');
        }
        const requestedRole = this.normalizeRole(credentials.role);
        if (!requestedRole || user.role !== requestedRole || !this.passwordMatches(credentials.password, user.password_hash)) {
            throw new common_1.UnauthorizedException('Invalid email, password, or role');
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
    validateToken(token) {
        const session = this.sessions.get(token);
        if (!session || session.expiresAt.getTime() <= Date.now()) {
            if (session)
                this.sessions.delete(token);
            throw new common_1.UnauthorizedException('Invalid or expired access token');
        }
        return {
            userId: session.userId,
            email: session.email,
            role: session.role,
            fullName: session.fullName,
        };
    }
    createSession(user) {
        const token = (0, node_crypto_1.randomBytes)(32).toString('base64url');
        const session = {
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
    passwordMatches(password, storedPassword) {
        const supplied = Buffer.from(password);
        const stored = Buffer.from(storedPassword);
        return supplied.length === stored.length && (0, node_crypto_1.timingSafeEqual)(supplied, stored);
    }
    normalizeRole(value) {
        const normalized = value.trim().toLowerCase().replace(/[\s-]+/g, '_');
        const aliases = {
            applicant: role_enum_1.Role.APPLICANT,
            field_officer: role_enum_1.Role.FIELD_OFFICER,
            fieldofficer: role_enum_1.Role.FIELD_OFFICER,
            officer: role_enum_1.Role.FIELD_OFFICER,
            department_officer: role_enum_1.Role.DEPARTMENT_OFFICER,
            departmentofficer: role_enum_1.Role.DEPARTMENT_OFFICER,
            superuser: role_enum_1.Role.SUPER_USER,
            super_user: role_enum_1.Role.SUPER_USER,
        };
        return aliases[normalized] ?? null;
    }
    getSessionTtlMs() {
        const configuredValue = Number(process.env.AUTH_SESSION_TTL_MS);
        return Number.isSafeInteger(configuredValue) && configuredValue > 0
            ? configuredValue
            : DEFAULT_SESSION_TTL_MS;
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        audit_logs_service_1.AuditLogsService])
], AuthService);
//# sourceMappingURL=auth.service.js.map