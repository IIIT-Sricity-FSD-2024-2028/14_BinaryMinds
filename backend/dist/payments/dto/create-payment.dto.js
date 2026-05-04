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
exports.CreatePaymentDto = void 0;
const openapi = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const payment_status_enum_1 = require("../../common/enums/payment-status.enum");
class CreatePaymentDto {
    application_id;
    amount;
    payment_status;
    transaction_id;
    static _OPENAPI_METADATA_FACTORY() {
        return { application_id: { required: true, type: () => Number }, amount: { required: true, type: () => Number }, payment_status: { required: false, enum: require("../../common/enums/payment-status.enum").PaymentStatus }, transaction_id: { required: false, type: () => String } };
    }
}
exports.CreatePaymentDto = CreatePaymentDto;
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", Number)
], CreatePaymentDto.prototype, "application_id", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", Number)
], CreatePaymentDto.prototype, "amount", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(payment_status_enum_1.PaymentStatus),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreatePaymentDto.prototype, "payment_status", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreatePaymentDto.prototype, "transaction_id", void 0);
//# sourceMappingURL=create-payment.dto.js.map