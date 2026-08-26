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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentsController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const swagger_1 = require("@nestjs/swagger");
const node_crypto_1 = require("node:crypto");
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
const multer_1 = require("multer");
const documents_service_1 = require("./documents.service");
const create_document_dto_1 = require("./dto/create-document.dto");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const roles_guard_1 = require("../common/guards/roles.guard");
const role_enum_1 = require("../common/enums/role.enum");
const document_type_enum_1 = require("../common/enums/document-type.enum");
const verification_status_enum_1 = require("../common/enums/verification-status.enum");
const api_route_decorator_1 = require("../common/swagger/api-route.decorator");
const document_storage_1 = require("./document-storage");
const document_upload_cleanup_interceptor_1 = require("./document-upload-cleanup.interceptor");
const maximumFileSize = 5 * 1024 * 1024;
const allowedFileTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.pdf': 'application/pdf',
};
(0, node_fs_1.mkdirSync)(document_storage_1.documentUploadDirectory, { recursive: true });
let DocumentsController = class DocumentsController {
    documentsService;
    constructor(documentsService) {
        this.documentsService = documentsService;
    }
    create(createDocumentDto, file) {
        if (!file) {
            throw new common_1.BadRequestException('A document file is required');
        }
        return this.documentsService.create(createDocumentDto, `uploads/documents/${file.filename}`);
    }
    findAll() {
        return this.documentsService.findAll();
    }
    findByApplication(applicationId) {
        return this.documentsService.findByApplication(applicationId);
    }
    findOne(id) {
        return this.documentsService.findOne(id);
    }
    updateStatus(id, status) {
        return this.documentsService.updateVerificationStatus(id, status);
    }
    remove(id) {
        return this.documentsService.remove(id);
    }
};
exports.DocumentsController = DocumentsController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.APPLICANT, role_enum_1.Role.DEPARTMENT_OFFICER),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiBody)({
        description: 'Document metadata and the file to upload.',
        schema: {
            type: 'object',
            required: ['application_id', 'document_type', 'file'],
            properties: {
                application_id: { type: 'number', example: 1 },
                document_type: {
                    enum: Object.values(document_type_enum_1.DocumentType),
                    example: document_type_enum_1.DocumentType.AADHAR_CARD,
                },
                file: { type: 'string', format: 'binary' },
            },
        },
    }),
    (0, common_1.UseInterceptors)(document_upload_cleanup_interceptor_1.DocumentUploadCleanupInterceptor),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        storage: (0, multer_1.diskStorage)({
            destination: document_storage_1.documentUploadDirectory,
            filename: (_request, file, callback) => {
                callback(null, `${(0, node_crypto_1.randomUUID)()}${(0, node_path_1.extname)(file.originalname).toLowerCase()}`);
            },
        }),
        limits: { fileSize: maximumFileSize },
        fileFilter: (_request, file, callback) => {
            const extension = (0, node_path_1.extname)(file.originalname).toLowerCase();
            if (allowedFileTypes[extension] !== file.mimetype) {
                callback(new common_1.BadRequestException('Only JPG, JPEG, PNG, and PDF files are allowed'), false);
                return;
            }
            callback(null, true);
        },
    })),
    (0, api_route_decorator_1.ApiRoute)({
        summary: 'Create uploaded document record',
        roles: [role_enum_1.Role.APPLICANT, role_enum_1.Role.DEPARTMENT_OFFICER],
        status: 201,
        responseExample: { document_id: 1, application_id: 1, verification_status: 'pending' },
    }),
    openapi.ApiResponse({ status: 201, type: Object }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_document_dto_1.CreateDocumentDto, Object]),
    __metadata("design:returntype", void 0)
], DocumentsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.DEPARTMENT_OFFICER, role_enum_1.Role.FIELD_OFFICER),
    (0, api_route_decorator_1.ApiRoute)({
        summary: 'List documents',
        roles: [role_enum_1.Role.DEPARTMENT_OFFICER, role_enum_1.Role.FIELD_OFFICER],
        responseExample: [{ document_id: 1, application_id: 1 }],
    }),
    openapi.ApiResponse({ status: 200, type: [Object] }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], DocumentsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('application/:applicationId'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.APPLICANT, role_enum_1.Role.DEPARTMENT_OFFICER, role_enum_1.Role.FIELD_OFFICER),
    (0, api_route_decorator_1.ApiRoute)({
        summary: 'List documents by application',
        roles: [role_enum_1.Role.APPLICANT, role_enum_1.Role.DEPARTMENT_OFFICER, role_enum_1.Role.FIELD_OFFICER],
        params: [{ name: 'applicationId', description: 'Application ID' }],
        responseExample: [{ document_id: 1, application_id: 1 }],
    }),
    openapi.ApiResponse({ status: 200, type: [Object] }),
    __param(0, (0, common_1.Param)('applicationId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], DocumentsController.prototype, "findByApplication", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.APPLICANT, role_enum_1.Role.DEPARTMENT_OFFICER, role_enum_1.Role.FIELD_OFFICER),
    (0, api_route_decorator_1.ApiRoute)({
        summary: 'Get document by ID',
        roles: [role_enum_1.Role.APPLICANT, role_enum_1.Role.DEPARTMENT_OFFICER, role_enum_1.Role.FIELD_OFFICER],
        params: [{ name: 'id', description: 'Document ID' }],
        responseExample: { document_id: 1, verification_status: 'pending' },
    }),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], DocumentsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.DEPARTMENT_OFFICER, role_enum_1.Role.FIELD_OFFICER),
    (0, api_route_decorator_1.ApiRoute)({
        summary: 'Update document verification status',
        roles: [role_enum_1.Role.DEPARTMENT_OFFICER, role_enum_1.Role.FIELD_OFFICER],
        params: [{ name: 'id', description: 'Document ID' }],
        bodySchema: {
            type: 'object',
            required: ['status'],
            properties: {
                status: { enum: Object.values(verification_status_enum_1.VerificationStatus), example: verification_status_enum_1.VerificationStatus.VERIFIED },
            },
        },
        responseExample: { document_id: 1, verification_status: 'verified' },
    }),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String]),
    __metadata("design:returntype", void 0)
], DocumentsController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.DEPARTMENT_OFFICER, role_enum_1.Role.APPLICANT),
    (0, api_route_decorator_1.ApiRoute)({
        summary: 'Delete document by ID',
        roles: [role_enum_1.Role.DEPARTMENT_OFFICER, role_enum_1.Role.APPLICANT],
        params: [{ name: 'id', description: 'Document ID' }],
        responseExample: true,
    }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], DocumentsController.prototype, "remove", null);
exports.DocumentsController = DocumentsController = __decorate([
    (0, swagger_1.ApiTags)('Documents'),
    (0, common_1.Controller)('documents'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [documents_service_1.DocumentsService])
], DocumentsController);
//# sourceMappingURL=documents.controller.js.map