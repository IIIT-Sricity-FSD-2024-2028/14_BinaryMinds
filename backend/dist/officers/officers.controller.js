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
exports.OfficersController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const officers_service_1 = require("./officers.service");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const roles_guard_1 = require("../common/guards/roles.guard");
const role_enum_1 = require("../common/enums/role.enum");
const swagger_1 = require("@nestjs/swagger");
const api_route_decorator_1 = require("../common/swagger/api-route.decorator");
let OfficersController = class OfficersController {
    officersService;
    constructor(officersService) {
        this.officersService = officersService;
    }
    findAll() {
        return {
            success: true,
            data: this.officersService.findAll(),
        };
    }
};
exports.OfficersController = OfficersController;
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.SUPER_USER),
    (0, api_route_decorator_1.ApiRoute)({
        summary: 'List officers with workload counts',
        roles: [role_enum_1.Role.SUPER_USER],
        responseDescription: 'List of officers with assignedCount and verifiedCount.',
        wrappedResponse: true,
        responseExample: [{ id: 2, assignedCount: 3, verifiedCount: 1 }],
        notFound: false,
    }),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], OfficersController.prototype, "findAll", null);
exports.OfficersController = OfficersController = __decorate([
    (0, swagger_1.ApiTags)('Officers'),
    (0, common_1.Controller)('officers'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [officers_service_1.OfficersService])
], OfficersController);
//# sourceMappingURL=officers.controller.js.map