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
exports.CreateDocumentVerificationDto = void 0;
const openapi = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const document_verification_status_enum_1 = require("../../common/enums/document-verification-status.enum");
class CreateDocumentVerificationDto {
    application_id;
    field_officer_id;
    verification_status;
    rejection_reason;
    static _OPENAPI_METADATA_FACTORY() {
        return { application_id: { required: true, type: () => Number }, field_officer_id: { required: true, type: () => Number }, verification_status: { required: false, enum: require("../../common/enums/document-verification-status.enum").DocumentVerificationStatus }, rejection_reason: { required: false, type: () => String } };
    }
}
exports.CreateDocumentVerificationDto = CreateDocumentVerificationDto;
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", Number)
], CreateDocumentVerificationDto.prototype, "application_id", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", Number)
], CreateDocumentVerificationDto.prototype, "field_officer_id", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(document_verification_status_enum_1.DocumentVerificationStatus),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateDocumentVerificationDto.prototype, "verification_status", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateDocumentVerificationDto.prototype, "rejection_reason", void 0);
//# sourceMappingURL=create-document-verification.dto.js.map