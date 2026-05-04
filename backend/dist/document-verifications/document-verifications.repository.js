"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentVerificationsRepository = void 0;
const common_1 = require("@nestjs/common");
const document_verification_status_enum_1 = require("../common/enums/document-verification-status.enum");
let DocumentVerificationsRepository = class DocumentVerificationsRepository {
    verifications = [];
    idCounter = 1;
    find() {
        return this.verifications;
    }
    findById(id) {
        return this.verifications.find((v) => v.verification_id === id);
    }
    findByApplication(applicationId) {
        return this.verifications.filter((v) => v.application_id === applicationId);
    }
    findByFieldOfficer(fieldOfficerId) {
        return this.verifications.filter((v) => v.field_officer_id === fieldOfficerId);
    }
    create(verification) {
        const newVerification = {
            ...verification,
            verification_id: this.idCounter++,
            verified_at: new Date(),
        };
        if (!newVerification.verification_status) {
            newVerification.verification_status = document_verification_status_enum_1.DocumentVerificationStatus.PENDING;
        }
        this.verifications.push(newVerification);
        return newVerification;
    }
    update(id, updateData) {
        const index = this.verifications.findIndex((v) => v.verification_id === id);
        if (index === -1)
            return undefined;
        this.verifications[index] = { ...this.verifications[index], ...updateData };
        return this.verifications[index];
    }
    delete(id) {
        const initialLength = this.verifications.length;
        this.verifications = this.verifications.filter((v) => v.verification_id !== id);
        return this.verifications.length !== initialLength;
    }
};
exports.DocumentVerificationsRepository = DocumentVerificationsRepository;
exports.DocumentVerificationsRepository = DocumentVerificationsRepository = __decorate([
    (0, common_1.Injectable)()
], DocumentVerificationsRepository);
//# sourceMappingURL=document-verifications.repository.js.map