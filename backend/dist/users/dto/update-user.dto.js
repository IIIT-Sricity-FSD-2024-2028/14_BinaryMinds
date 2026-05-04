"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateUserDto = void 0;
const openapi = require("@nestjs/swagger");
const swagger_1 = require("@nestjs/swagger");
const create_user_dto_1 = require("./create-user.dto");
class UpdateUserDto extends (0, swagger_1.PartialType)(create_user_dto_1.CreateUserDto) {
    static _OPENAPI_METADATA_FACTORY() {
        return {};
    }
}
exports.UpdateUserDto = UpdateUserDto;
//# sourceMappingURL=update-user.dto.js.map