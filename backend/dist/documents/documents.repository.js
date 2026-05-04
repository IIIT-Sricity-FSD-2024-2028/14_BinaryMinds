"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentsRepository = void 0;
const common_1 = require("@nestjs/common");
const verification_status_enum_1 = require("../common/enums/verification-status.enum");
let DocumentsRepository = class DocumentsRepository {
    documents = [];
    idCounter = 1;
    find() {
        return this.documents;
    }
    findById(id) {
        return this.documents.find((doc) => doc.document_id === id);
    }
    findByApplication(applicationId) {
        return this.documents.filter((doc) => doc.application_id === applicationId);
    }
    create(document) {
        const newDocument = {
            ...document,
            document_id: this.idCounter++,
            uploaded_at: new Date(),
        };
        if (!newDocument.verification_status) {
            newDocument.verification_status = verification_status_enum_1.VerificationStatus.PENDING;
        }
        this.documents.push(newDocument);
        return newDocument;
    }
    update(id, updateData) {
        const index = this.documents.findIndex((doc) => doc.document_id === id);
        if (index === -1)
            return undefined;
        this.documents[index] = { ...this.documents[index], ...updateData };
        return this.documents[index];
    }
    delete(id) {
        const initialLength = this.documents.length;
        this.documents = this.documents.filter((doc) => doc.document_id !== id);
        return this.documents.length !== initialLength;
    }
};
exports.DocumentsRepository = DocumentsRepository;
exports.DocumentsRepository = DocumentsRepository = __decorate([
    (0, common_1.Injectable)()
], DocumentsRepository);
//# sourceMappingURL=documents.repository.js.map