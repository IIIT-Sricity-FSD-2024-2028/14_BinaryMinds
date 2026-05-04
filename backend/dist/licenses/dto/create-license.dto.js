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
exports.CreateLicenseDto = void 0;
const openapi = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class CreateLicenseDto {
    application_id;
    issued_by;
    expiry_date;
    static _OPENAPI_METADATA_FACTORY() {
        return { application_id: { required: true, type: () => Number }, issued_by: { required: true, type: () => Number }, expiry_date: { required: true, type: () => Date } };
    }
}
exports.CreateLicenseDto = CreateLicenseDto;
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", Number)
], CreateLicenseDto.prototype, "application_id", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", Number)
], CreateLicenseDto.prototype, "issued_by", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", Date)
], CreateLicenseDto.prototype, "expiry_date", void 0);
//# sourceMappingURL=create-license.dto.js.map