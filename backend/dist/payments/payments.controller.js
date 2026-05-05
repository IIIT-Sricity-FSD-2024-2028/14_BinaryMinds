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
exports.PaymentsController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const payments_service_1 = require("./payments.service");
const create_payment_dto_1 = require("./dto/create-payment.dto");
const update_payment_dto_1 = require("./dto/update-payment.dto");
const verify_payment_dto_1 = require("./dto/verify-payment.dto");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const roles_guard_1 = require("../common/guards/roles.guard");
const role_enum_1 = require("../common/enums/role.enum");
const swagger_1 = require("@nestjs/swagger");
const api_route_decorator_1 = require("../common/swagger/api-route.decorator");
let PaymentsController = class PaymentsController {
    paymentsService;
    constructor(paymentsService) {
        this.paymentsService = paymentsService;
    }
    create(createDto) {
        return this.paymentsService.create(createDto);
    }
    findAll() {
        return this.paymentsService.findAll();
    }
    findByApplication(applicationId) {
        return this.paymentsService.findByApplication(applicationId);
    }
    findOne(id) {
        return this.paymentsService.findOne(id);
    }
    update(id, updateDto) {
        return this.paymentsService.update(id, updateDto);
    }
    verifyPayment(id, verifyDto) {
        return this.paymentsService.verifyPayment(id, verifyDto.transaction_id, verifyDto.is_successful);
    }
    remove(id) {
        return this.paymentsService.remove(id);
    }
};
exports.PaymentsController = PaymentsController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.APPLICANT, role_enum_1.Role.DEPARTMENT_OFFICER),
    (0, api_route_decorator_1.ApiRoute)({
        summary: 'Create payment',
        roles: [role_enum_1.Role.APPLICANT, role_enum_1.Role.DEPARTMENT_OFFICER],
        bodyType: create_payment_dto_1.CreatePaymentDto,
        status: 201,
        responseExample: { payment_id: 1, payment_status: 'pending', transaction_id: 'TXN-...' },
    }),
    openapi.ApiResponse({ status: 201, type: Object }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_payment_dto_1.CreatePaymentDto]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.DEPARTMENT_OFFICER, role_enum_1.Role.FIELD_OFFICER),
    (0, api_route_decorator_1.ApiRoute)({
        summary: 'List payments',
        roles: [role_enum_1.Role.DEPARTMENT_OFFICER, role_enum_1.Role.FIELD_OFFICER],
        responseExample: [{ payment_id: 1, application_id: 1, payment_status: 'pending' }],
    }),
    openapi.ApiResponse({ status: 200, type: [Object] }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('application/:applicationId'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.APPLICANT, role_enum_1.Role.DEPARTMENT_OFFICER, role_enum_1.Role.FIELD_OFFICER),
    (0, api_route_decorator_1.ApiRoute)({
        summary: 'List payments by application',
        roles: [role_enum_1.Role.APPLICANT, role_enum_1.Role.DEPARTMENT_OFFICER, role_enum_1.Role.FIELD_OFFICER],
        params: [{ name: 'applicationId', description: 'Application ID' }],
        responseExample: [{ payment_id: 1, application_id: 1 }],
    }),
    openapi.ApiResponse({ status: 200, type: [Object] }),
    __param(0, (0, common_1.Param)('applicationId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "findByApplication", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.APPLICANT, role_enum_1.Role.DEPARTMENT_OFFICER, role_enum_1.Role.FIELD_OFFICER),
    (0, api_route_decorator_1.ApiRoute)({
        summary: 'Get payment by ID',
        roles: [role_enum_1.Role.APPLICANT, role_enum_1.Role.DEPARTMENT_OFFICER, role_enum_1.Role.FIELD_OFFICER],
        params: [{ name: 'id', description: 'Payment ID' }],
        responseExample: { payment_id: 1, payment_status: 'pending' },
    }),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.DEPARTMENT_OFFICER, role_enum_1.Role.APPLICANT),
    (0, api_route_decorator_1.ApiRoute)({
        summary: 'Update payment by ID',
        roles: [role_enum_1.Role.DEPARTMENT_OFFICER, role_enum_1.Role.APPLICANT],
        params: [{ name: 'id', description: 'Payment ID' }],
        bodyType: update_payment_dto_1.UpdatePaymentDto,
        responseExample: { payment_id: 1, payment_status: 'completed' },
    }),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_payment_dto_1.UpdatePaymentDto]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(':id/verify'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.DEPARTMENT_OFFICER),
    (0, api_route_decorator_1.ApiRoute)({
        summary: 'Verify payment',
        roles: [role_enum_1.Role.DEPARTMENT_OFFICER],
        params: [{ name: 'id', description: 'Payment ID' }],
        bodyType: verify_payment_dto_1.VerifyPaymentDto,
        status: 201,
        responseExample: { payment_id: 1, payment_status: 'completed', transaction_id: 'TXN-...' },
    }),
    openapi.ApiResponse({ status: 201, type: Object }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, verify_payment_dto_1.VerifyPaymentDto]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "verifyPayment", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.DEPARTMENT_OFFICER),
    (0, api_route_decorator_1.ApiRoute)({
        summary: 'Delete payment by ID',
        roles: [role_enum_1.Role.DEPARTMENT_OFFICER],
        params: [{ name: 'id', description: 'Payment ID' }],
        responseExample: true,
    }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "remove", null);
exports.PaymentsController = PaymentsController = __decorate([
    (0, swagger_1.ApiTags)('Payments'),
    (0, common_1.Controller)('payments'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [payments_service_1.PaymentsService])
], PaymentsController);
//# sourceMappingURL=payments.controller.js.map