"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateInspectionDto = void 0;
const openapi = require("@nestjs/swagger");
const swagger_1 = require("@nestjs/swagger");
const create_inspection_dto_1 = require("./create-inspection.dto");
class UpdateInspectionDto extends (0, swagger_1.PartialType)(create_inspection_dto_1.CreateInspectionDto) {
    static _OPENAPI_METADATA_FACTORY() {
        return {};
    }
}
exports.UpdateInspectionDto = UpdateInspectionDto;
//# sourceMappingURL=update-inspection.dto.js.map