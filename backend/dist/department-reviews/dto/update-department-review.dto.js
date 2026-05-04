"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateDepartmentReviewDto = void 0;
const openapi = require("@nestjs/swagger");
const swagger_1 = require("@nestjs/swagger");
const create_department_review_dto_1 = require("./create-department-review.dto");
class UpdateDepartmentReviewDto extends (0, swagger_1.PartialType)(create_department_review_dto_1.CreateDepartmentReviewDto) {
    static _OPENAPI_METADATA_FACTORY() {
        return {};
    }
}
exports.UpdateDepartmentReviewDto = UpdateDepartmentReviewDto;
//# sourceMappingURL=update-department-review.dto.js.map