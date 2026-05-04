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
exports.DocumentVerificationsService = void 0;
const common_1 = require("@nestjs/common");
const document_verifications_repository_1 = require("./document-verifications.repository");
const document_verification_status_enum_1 = require("../common/enums/document-verification-status.enum");
let DocumentVerificationsService = class DocumentVerificationsService {
    repository;
    constructor(repository) {
        this.repository = repository;
    }
    findAll() {
        return this.repository.find();
    }
    findOne(id) {
        const verification = this.repository.findById(id);
        if (!verification) {
            throw new common_1.NotFoundException(`Verification with ID ${id} not found`);
        }
        return verification;
    }
    findByApplication(applicationId) {
        return this.repository.findByApplication(applicationId);
    }
    findByFieldOfficer(fieldOfficerId) {
        return this.repository.findByFieldOfficer(fieldOfficerId);
    }
    create(data) {
        this.validateStatusLogic(data.verification_status, data.rejection_reason);
        const createData = {
            ...data,
            verification_status: data.verification_status || document_verification_status_enum_1.DocumentVerificationStatus.PENDING,
        };
        return this.repository.create(createData);
    }
    update(id, updateData) {
        const existing = this.findOne(id);
        const newStatus = updateData.verification_status || existing.verification_status;
        const newReason = updateData.rejection_reason !== undefined
            ? updateData.rejection_reason
            : existing.rejection_reason;
        this.validateStatusLogic(newStatus, newReason);
        const updated = this.repository.update(id, updateData);
        if (!updated) {
            throw new common_1.NotFoundException(`Validation error updating ID ${id}`);
        }
        return updated;
    }
    remove(id) {
        this.findOne(id);
        this.repository.delete(id);
    }
    validateStatusLogic(status, rejectionReason) {
        if (status === document_verification_status_enum_1.DocumentVerificationStatus.REJECTED_ON_VERIFICATION &&
            (!rejectionReason || rejectionReason.trim() === '')) {
            throw new common_1.BadRequestException('A rejection reason must be strongly provided when rejecting a verification');
        }
    }
};
exports.DocumentVerificationsService = DocumentVerificationsService;
exports.DocumentVerificationsService = DocumentVerificationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [document_verifications_repository_1.DocumentVerificationsRepository])
], DocumentVerificationsService);
//# sourceMappingURL=document-verifications.service.js.map