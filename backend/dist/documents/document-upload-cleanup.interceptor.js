"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentUploadCleanupInterceptor = void 0;
const common_1 = require("@nestjs/common");
const rxjs_1 = require("rxjs");
const document_storage_1 = require("./document-storage");
let DocumentUploadCleanupInterceptor = class DocumentUploadCleanupInterceptor {
    intercept(context, next) {
        const request = context.switchToHttp().getRequest();
        const file = request.file;
        try {
            if (file)
                (0, document_storage_1.assertValidDocumentSignature)(file);
        }
        catch (error) {
            this.removeFile(file);
            throw error;
        }
        return next.handle().pipe((0, rxjs_1.catchError)((error) => {
            this.removeFile(file);
            return (0, rxjs_1.throwError)(() => error);
        }));
    }
    removeFile(file) {
        if (!file?.path)
            return;
        try {
            (0, document_storage_1.removeStoredUpload)(file.path);
        }
        catch {
        }
    }
};
exports.DocumentUploadCleanupInterceptor = DocumentUploadCleanupInterceptor;
exports.DocumentUploadCleanupInterceptor = DocumentUploadCleanupInterceptor = __decorate([
    (0, common_1.Injectable)()
], DocumentUploadCleanupInterceptor);
//# sourceMappingURL=document-upload-cleanup.interceptor.js.map