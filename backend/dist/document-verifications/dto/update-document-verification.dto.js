"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateDocumentVerificationDto = void 0;
const openapi = require("@nestjs/swagger");
const swagger_1 = require("@nestjs/swagger");
const create_document_verification_dto_1 = require("./create-document-verification.dto");
class UpdateDocumentVerificationDto extends (0, swagger_1.PartialType)(create_document_verification_dto_1.CreateDocumentVerificationDto) {
    static _OPENAPI_METADATA_FACTORY() {
        return {};
    }
}
exports.UpdateDocumentVerificationDto = UpdateDocumentVerificationDto;
//# sourceMappingURL=update-document-verification.dto.js.map