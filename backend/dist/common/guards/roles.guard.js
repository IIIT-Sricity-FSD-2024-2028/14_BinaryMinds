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
exports.RolesGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const role_enum_1 = require("../enums/role.enum");
const roles_decorator_1 = require("../decorators/roles.decorator");
let RolesGuard = class RolesGuard {
    reflector;
    constructor(reflector) {
        this.reflector = reflector;
    }
    normalizeRole(raw) {
        const map = {
            superuser: role_enum_1.Role.SUPER_USER,
            super_user: role_enum_1.Role.SUPER_USER,
            officer: role_enum_1.Role.FIELD_OFFICER,
            field_officer: role_enum_1.Role.FIELD_OFFICER,
            applicant: role_enum_1.Role.APPLICANT,
            department_officer: role_enum_1.Role.DEPARTMENT_OFFICER,
        };
        return map[raw.toLowerCase()] || raw;
    }
    canActivate(context) {
        const requiredRoles = this.reflector.getAllAndOverride(roles_decorator_1.ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (!requiredRoles) {
            return true;
        }
        const request = context.switchToHttp().getRequest();
        const rawRole = request.headers['role'];
        if (!rawRole) {
            throw new common_1.ForbiddenException('Role header is missing');
        }
        const userRole = this.normalizeRole(rawRole);
        if (!requiredRoles.includes(userRole)) {
            throw new common_1.ForbiddenException('You do not have access to this resource');
        }
        return true;
    }
};
exports.RolesGuard = RolesGuard;
exports.RolesGuard = RolesGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector])
], RolesGuard);
//# sourceMappingURL=roles.guard.js.map