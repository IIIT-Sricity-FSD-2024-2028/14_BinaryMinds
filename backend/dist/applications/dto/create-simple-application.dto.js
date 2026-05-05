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
exports.CreateSimpleApplicationDto = void 0;
const openapi = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class CreateSimpleApplicationDto {
    applicantName;
    businessName;
    tradeCategory;
    shopAddress;
    phone;
    static _OPENAPI_METADATA_FACTORY() {
        return { applicantName: { required: true, type: () => String, maxLength: 120 }, businessName: { required: false, type: () => String, maxLength: 160 }, tradeCategory: { required: false, type: () => String, maxLength: 120 }, shopAddress: { required: false, type: () => String, maxLength: 240 }, phone: { required: false, type: () => String, maxLength: 20 } };
    }
}
exports.CreateSimpleApplicationDto = CreateSimpleApplicationDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Full name of the applicant', example: 'Applicant Name' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", String)
], CreateSimpleApplicationDto.prototype, "applicantName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Business name', example: 'Registered Business Name', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MaxLength)(160),
    __metadata("design:type", String)
], CreateSimpleApplicationDto.prototype, "businessName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Trade category', example: 'Retail', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", String)
], CreateSimpleApplicationDto.prototype, "tradeCategory", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Shop or business address', example: 'Registered business address', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MaxLength)(240),
    __metadata("design:type", String)
], CreateSimpleApplicationDto.prototype, "shopAddress", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Applicant phone number', example: '9876543210', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MaxLength)(20),
    __metadata("design:type", String)
], CreateSimpleApplicationDto.prototype, "phone", void 0);
//# sourceMappingURL=create-simple-application.dto.js.map