"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateComplianceRecordDto = void 0;
const openapi = require("@nestjs/swagger");
const swagger_1 = require("@nestjs/swagger");
const create_compliance_record_dto_1 = require("./create-compliance-record.dto");
class UpdateComplianceRecordDto extends (0, swagger_1.PartialType)(create_compliance_record_dto_1.CreateComplianceRecordDto) {
    static _OPENAPI_METADATA_FACTORY() {
        return {};
    }
}
exports.UpdateComplianceRecordDto = UpdateComplianceRecordDto;
//# sourceMappingURL=update-compliance-record.dto.js.map