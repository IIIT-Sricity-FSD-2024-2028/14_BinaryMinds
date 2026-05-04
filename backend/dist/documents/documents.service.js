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
exports.DocumentsService = void 0;
const common_1 = require("@nestjs/common");
const documents_repository_1 = require("./documents.repository");
const applications_service_1 = require("../applications/applications.service");
const verification_status_enum_1 = require("../common/enums/verification-status.enum");
let DocumentsService = class DocumentsService {
    documentsRepository;
    applicationsService;
    constructor(documentsRepository, applicationsService) {
        this.documentsRepository = documentsRepository;
        this.applicationsService = applicationsService;
    }
    findAll() {
        return this.documentsRepository.find();
    }
    findOne(id) {
        const document = this.documentsRepository.findById(id);
        if (!document) {
            throw new common_1.NotFoundException(`Document with ID ${id} not found`);
        }
        return document;
    }
    findByApplication(applicationId) {
        this.applicationsService.findOne(applicationId);
        return this.documentsRepository.findByApplication(applicationId);
    }
    create(createDocumentDto) {
        this.applicationsService.findOne(createDocumentDto.application_id);
        const sanitizedPath = createDocumentDto.file_path.trim();
        const newDoc = {
            ...createDocumentDto,
            file_path: sanitizedPath,
            verification_status: verification_status_enum_1.VerificationStatus.PENDING,
        };
        return this.documentsRepository.create(newDoc);
    }
    updateVerificationStatus(id, status) {
        this.findOne(id);
        const updated = this.documentsRepository.update(id, {
            verification_status: status,
        });
        if (!updated) {
            throw new common_1.NotFoundException(`Document with ID ${id} not found during update`);
        }
        return updated;
    }
    remove(id) {
        this.findOne(id);
        this.documentsRepository.delete(id);
    }
};
exports.DocumentsService = DocumentsService;
exports.DocumentsService = DocumentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [documents_repository_1.DocumentsRepository,
        applications_service_1.ApplicationsService])
], DocumentsService);
//# sourceMappingURL=documents.service.js.map