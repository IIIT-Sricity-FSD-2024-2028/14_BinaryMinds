"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentVerificationsModule = void 0;
const common_1 = require("@nestjs/common");
const document_verifications_repository_1 = require("./document-verifications.repository");
const document_verifications_service_1 = require("./document-verifications.service");
let DocumentVerificationsModule = class DocumentVerificationsModule {
};
exports.DocumentVerificationsModule = DocumentVerificationsModule;
exports.DocumentVerificationsModule = DocumentVerificationsModule = __decorate([
    (0, common_1.Module)({
        providers: [document_verifications_repository_1.DocumentVerificationsRepository, document_verifications_service_1.DocumentVerificationsService],
        exports: [document_verifications_service_1.DocumentVerificationsService],
    })
], DocumentVerificationsModule);
//# sourceMappingURL=document-verifications.module.js.map