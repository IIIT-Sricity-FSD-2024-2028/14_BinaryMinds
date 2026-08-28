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
exports.PaymentsRepository = void 0;
const common_1 = require("@nestjs/common");
const payment_status_enum_1 = require("../common/enums/payment-status.enum");
const json_store_1 = require("../common/persistence/json-store");
let PaymentsRepository = class PaymentsRepository {
    store;
    constructor(store) {
        this.store = store;
    }
    find() {
        return this.store.snapshot().payments;
    }
    findById(id) {
        return this.find().find((p) => p.payment_id === id);
    }
    findByApplication(applicationId) {
        return this.find().filter((p) => p.application_id === applicationId);
    }
    create(payment) {
        const newPayment = {
            ...payment,
            payment_id: this.store.snapshot().counters.payments++,
            payment_date: new Date(),
        };
        if (!newPayment.payment_status) {
            newPayment.payment_status = payment_status_enum_1.PaymentStatus.PENDING;
        }
        this.find().push(newPayment);
        this.store.save();
        return newPayment;
    }
    update(id, updateData) {
        const payments = this.find();
        const index = payments.findIndex((p) => p.payment_id === id);
        if (index === -1)
            return undefined;
        payments[index] = { ...payments[index], ...updateData };
        this.store.save();
        return payments[index];
    }
    delete(id) {
        const payments = this.find();
        const initialLength = payments.length;
        const remaining = payments.filter((p) => p.payment_id !== id);
        if (remaining.length === initialLength)
            return false;
        payments.splice(0, payments.length, ...remaining);
        this.store.save();
        return true;
    }
};
exports.PaymentsRepository = PaymentsRepository;
exports.PaymentsRepository = PaymentsRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [json_store_1.JsonStore])
], PaymentsRepository);
//# sourceMappingURL=payments.repository.js.map