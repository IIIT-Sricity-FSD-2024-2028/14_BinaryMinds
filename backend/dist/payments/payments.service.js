"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsService = void 0;
const crypto = __importStar(require("crypto"));
const common_1 = require("@nestjs/common");
const payments_repository_1 = require("./payments.repository");
const payment_status_enum_1 = require("../common/enums/payment-status.enum");
const applications_service_1 = require("../applications/applications.service");
let PaymentsService = class PaymentsService {
    repository;
    applicationsService;
    constructor(repository, applicationsService) {
        this.repository = repository;
        this.applicationsService = applicationsService;
    }
    findAll() {
        return this.repository.find();
    }
    findOne(id) {
        const payment = this.repository.findById(id);
        if (!payment) {
            throw new common_1.NotFoundException(`Payment with ID ${id} not found`);
        }
        return payment;
    }
    findByApplication(applicationId) {
        return this.repository.findByApplication(applicationId);
    }
    create(data) {
        this.applicationsService.findOne(data.application_id);
        const transactionId = data.transaction_id || `TXN-${crypto.randomUUID()}`;
        const createData = {
            ...data,
            payment_status: data.payment_status || payment_status_enum_1.PaymentStatus.PENDING,
            transaction_id: transactionId,
        };
        return this.repository.create(createData);
    }
    update(id, updateData) {
        const existing = this.findOne(id);
        if (existing.payment_status === payment_status_enum_1.PaymentStatus.COMPLETED &&
            updateData.payment_status &&
            updateData.payment_status !== payment_status_enum_1.PaymentStatus.COMPLETED &&
            updateData.payment_status !== payment_status_enum_1.PaymentStatus.REFUNDED) {
            throw new common_1.BadRequestException('Cannot change status of a COMPLETED payment except to REFUNDED');
        }
        if (existing.payment_status === payment_status_enum_1.PaymentStatus.REFUNDED) {
            throw new common_1.BadRequestException('Cannot modify a REFUNDED payment');
        }
        const updated = this.repository.update(id, updateData);
        if (!updated) {
            throw new common_1.NotFoundException(`Payment with ID ${id} not found`);
        }
        return updated;
    }
    verifyPayment(id, transactionId, isSuccessful) {
        const existing = this.findOne(id);
        if (existing.payment_status !== payment_status_enum_1.PaymentStatus.PENDING) {
            throw new common_1.BadRequestException('Can only verify PENDING payments');
        }
        const newStatus = isSuccessful ? payment_status_enum_1.PaymentStatus.COMPLETED : payment_status_enum_1.PaymentStatus.FAILED;
        const updated = this.repository.update(id, {
            payment_status: newStatus,
            transaction_id: transactionId || existing.transaction_id,
            payment_date: new Date(),
        });
        if (!updated) {
            throw new common_1.NotFoundException(`Payment with ID ${id} not found`);
        }
        return updated;
    }
    remove(id) {
        this.findOne(id);
        this.repository.delete(id);
    }
};
exports.PaymentsService = PaymentsService;
exports.PaymentsService = PaymentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [payments_repository_1.PaymentsRepository,
        applications_service_1.ApplicationsService])
], PaymentsService);
//# sourceMappingURL=payments.service.js.map