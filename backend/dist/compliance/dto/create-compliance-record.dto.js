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
exports.CreateComplianceRecordDto = void 0;
const openapi = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const compliance_status_enum_1 = require("../../common/enums/compliance-status.enum");
class CreateComplianceRecordDto {
    license_id;
    field_officer_id;
    violation_type;
    description;
    status;
    static _OPENAPI_METADATA_FACTORY() {
        return { license_id: { required: true, type: () => Number }, field_officer_id: { required: true, type: () => Number }, violation_type: { required: true, type: () => String }, description: { required: true, type: () => String }, status: { required: false, enum: require("../../common/enums/compliance-status.enum").ComplianceStatus } };
    }
}
exports.CreateComplianceRecordDto = CreateComplianceRecordDto;
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", Number)
], CreateComplianceRecordDto.prototype, "license_id", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", Number)
], CreateComplianceRecordDto.prototype, "field_officer_id", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateComplianceRecordDto.prototype, "violation_type", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateComplianceRecordDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(compliance_status_enum_1.ComplianceStatus),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateComplianceRecordDto.prototype, "status", void 0);
//# sourceMappingURL=create-compliance-record.dto.js.map