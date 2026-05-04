"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsRepository = void 0;
const common_1 = require("@nestjs/common");
const payment_status_enum_1 = require("../common/enums/payment-status.enum");
let PaymentsRepository = class PaymentsRepository {
    payments = [];
    idCounter = 1;
    find() {
        return this.payments;
    }
    findById(id) {
        return this.payments.find((p) => p.payment_id === id);
    }
    findByApplication(applicationId) {
        return this.payments.filter((p) => p.application_id === applicationId);
    }
    create(payment) {
        const newPayment = {
            ...payment,
            payment_id: this.idCounter++,
            payment_date: new Date(),
        };
        if (!newPayment.payment_status) {
            newPayment.payment_status = payment_status_enum_1.PaymentStatus.PENDING;
        }
        this.payments.push(newPayment);
        return newPayment;
    }
    update(id, updateData) {
        const index = this.payments.findIndex((p) => p.payment_id === id);
        if (index === -1)
            return undefined;
        this.payments[index] = { ...this.payments[index], ...updateData };
        return this.payments[index];
    }
    delete(id) {
        const initialLength = this.payments.length;
        this.payments = this.payments.filter((p) => p.payment_id !== id);
        return this.payments.length !== initialLength;
    }
};
exports.PaymentsRepository = PaymentsRepository;
exports.PaymentsRepository = PaymentsRepository = __decorate([
    (0, common_1.Injectable)()
], PaymentsRepository);
//# sourceMappingURL=payments.repository.js.map