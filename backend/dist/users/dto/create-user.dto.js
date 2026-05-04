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
exports.CreateUserDto = void 0;
const openapi = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const role_enum_1 = require("../../common/enums/role.enum");
class CreateUserDto {
    full_name;
    email;
    phone;
    password_hash;
    role;
    static _OPENAPI_METADATA_FACTORY() {
        return { full_name: { required: true, type: () => String, maxLength: 120 }, email: { required: true, type: () => String, maxLength: 120, format: "email" }, phone: { required: true, type: () => String, maxLength: 15 }, password_hash: { required: true, type: () => String, minLength: 6, maxLength: 255 }, role: { required: true, enum: require("../../common/enums/role.enum").Role } };
    }
}
exports.CreateUserDto = CreateUserDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", String)
], CreateUserDto.prototype, "full_name", void 0);
__decorate([
    (0, class_validator_1.IsEmail)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", String)
], CreateUserDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(15),
    __metadata("design:type", String)
], CreateUserDto.prototype, "phone", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MinLength)(6, { message: 'Password must be at least 6 characters long' }),
    (0, class_validator_1.MaxLength)(255),
    __metadata("design:type", String)
], CreateUserDto.prototype, "password_hash", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(role_enum_1.Role, { message: 'Role must be a valid enum value' }),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateUserDto.prototype, "role", void 0);
//# sourceMappingURL=create-user.dto.js.map