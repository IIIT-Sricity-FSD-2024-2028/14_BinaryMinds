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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const users_service_1 = require("./users.service");
const create_user_dto_1 = require("./dto/create-user.dto");
const update_user_dto_1 = require("./dto/update-user.dto");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const roles_guard_1 = require("../common/guards/roles.guard");
const role_enum_1 = require("../common/enums/role.enum");
const swagger_1 = require("@nestjs/swagger");
const api_route_decorator_1 = require("../common/swagger/api-route.decorator");
const audit_logs_service_1 = require("../audit-logs/audit-logs.service");
let UsersController = class UsersController {
    usersService;
    auditLogsService;
    constructor(usersService, auditLogsService) {
        this.usersService = usersService;
        this.auditLogsService = auditLogsService;
    }
    create(createUserDto) {
        const user = this.usersService.create(createUserDto);
        this.auditLogsService.log({
            user_name: user.full_name,
            role: String(user.role),
            action: 'Create',
            module: 'Users',
            description: `Created user ${user.email}`,
            ip_address: '127.0.0.1',
            source: 'backend',
        });
        return user;
    }
    findAll() {
        return this.usersService.findAll();
    }
    findOne(id) {
        return this.usersService.findOne(id);
    }
    update(id, updateUserDto) {
        const user = this.usersService.update(id, updateUserDto);
        this.auditLogsService.log({
            user_name: user.full_name,
            role: String(user.role),
            action: 'Update',
            module: 'Users',
            description: `Updated user ${user.email}`,
            ip_address: '127.0.0.1',
            source: 'backend',
        });
        return user;
    }
    remove(id) {
        const existing = this.usersService.findOne(id);
        const removed = this.usersService.remove(id);
        this.auditLogsService.log({
            user_name: existing.full_name,
            role: String(existing.role),
            action: 'Delete',
            module: 'Users',
            description: `Deleted user ${existing.email}`,
            ip_address: '127.0.0.1',
            source: 'backend',
        });
        return removed;
    }
};
exports.UsersController = UsersController;
__decorate([
    (0, common_1.Post)(),
    (0, api_route_decorator_1.ApiRoute)({
        summary: 'Create user',
        description: 'Registers or creates a user record.',
        bodyType: create_user_dto_1.CreateUserDto,
        status: 201,
        responseDescription: 'Created user.',
        responseExample: { user_id: 1, full_name: 'Applicant Name', email: 'user@example.com', role: 'applicant' },
        notFound: false,
    }),
    openapi.ApiResponse({ status: 201, type: Object }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_user_dto_1.CreateUserDto]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.DEPARTMENT_OFFICER),
    (0, api_route_decorator_1.ApiRoute)({
        summary: 'List all users',
        roles: [role_enum_1.Role.DEPARTMENT_OFFICER],
        responseExample: [{ user_id: 1, full_name: 'Applicant Name', role: 'applicant' }],
    }),
    openapi.ApiResponse({ status: 200, type: [Object] }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.DEPARTMENT_OFFICER, role_enum_1.Role.FIELD_OFFICER, role_enum_1.Role.APPLICANT),
    (0, api_route_decorator_1.ApiRoute)({
        summary: 'Get user by ID',
        roles: [role_enum_1.Role.DEPARTMENT_OFFICER, role_enum_1.Role.FIELD_OFFICER, role_enum_1.Role.APPLICANT],
        params: [{ name: 'id', description: 'User ID' }],
        responseExample: { user_id: 1, full_name: 'Applicant Name', role: 'applicant' },
    }),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.DEPARTMENT_OFFICER, role_enum_1.Role.APPLICANT),
    (0, api_route_decorator_1.ApiRoute)({
        summary: 'Update user by ID',
        roles: [role_enum_1.Role.DEPARTMENT_OFFICER, role_enum_1.Role.APPLICANT],
        params: [{ name: 'id', description: 'User ID' }],
        bodyType: update_user_dto_1.UpdateUserDto,
        responseExample: { user_id: 1, full_name: 'Updated Name', role: 'applicant' },
    }),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_user_dto_1.UpdateUserDto]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.DEPARTMENT_OFFICER),
    (0, api_route_decorator_1.ApiRoute)({
        summary: 'Delete user by ID',
        roles: [role_enum_1.Role.DEPARTMENT_OFFICER],
        params: [{ name: 'id', description: 'User ID' }],
        responseExample: true,
    }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "remove", null);
exports.UsersController = UsersController = __decorate([
    (0, swagger_1.ApiTags)('Users'),
    (0, common_1.Controller)('users'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        audit_logs_service_1.AuditLogsService])
], UsersController);
//# sourceMappingURL=users.controller.js.map