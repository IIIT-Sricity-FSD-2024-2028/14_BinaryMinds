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
exports.UpdateApplicationDto = void 0;
const openapi = require("@nestjs/swagger");
const swagger_1 = require("@nestjs/swagger");
const create_application_dto_1 = require("./create-application.dto");
const application_status_enum_1 = require("../../common/enums/application-status.enum");
const class_validator_1 = require("class-validator");
class UpdateApplicationDto extends (0, swagger_1.PartialType)(create_application_dto_1.CreateApplicationDto) {
    application_status;
    static _OPENAPI_METADATA_FACTORY() {
        return { application_status: { required: false, enum: require("../../common/enums/application-status.enum").ApplicationStatus } };
    }
}
exports.UpdateApplicationDto = UpdateApplicationDto;
__decorate([
    (0, class_validator_1.IsEnum)(application_status_enum_1.ApplicationStatus),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateApplicationDto.prototype, "application_status", void 0);
//# sourceMappingURL=update-application.dto.js.map