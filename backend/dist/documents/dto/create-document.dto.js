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
exports.CreateDocumentDto = void 0;
const openapi = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const document_type_enum_1 = require("../../common/enums/document-type.enum");
class CreateDocumentDto {
    application_id;
    document_type;
    file_path;
    static _OPENAPI_METADATA_FACTORY() {
        return { application_id: { required: true, type: () => Number }, document_type: { required: true, enum: require("../../common/enums/document-type.enum").DocumentType }, file_path: { required: true, type: () => String } };
    }
}
exports.CreateDocumentDto = CreateDocumentDto;
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", Number)
], CreateDocumentDto.prototype, "application_id", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(document_type_enum_1.DocumentType),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateDocumentDto.prototype, "document_type", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateDocumentDto.prototype, "file_path", void 0);
//# sourceMappingURL=create-document.dto.js.map