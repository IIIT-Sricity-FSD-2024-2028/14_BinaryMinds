"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.documentUploadDirectory = void 0;
exports.assertValidDocumentSignature = assertValidDocumentSignature;
exports.removeStoredUpload = removeStoredUpload;
exports.resolveStoredDocumentPath = resolveStoredDocumentPath;
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
const common_1 = require("@nestjs/common");
exports.documentUploadDirectory = (0, node_path_1.resolve)(__dirname, '..', '..', 'uploads', 'documents');
const fileSignatures = {
    '.png': {
        mimeType: 'image/png',
        matches: (bytes) => bytes.length >= 8 &&
            bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
    },
    '.jpg': {
        mimeType: 'image/jpeg',
        matches: (bytes) => bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff,
    },
    '.jpeg': {
        mimeType: 'image/jpeg',
        matches: (bytes) => bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff,
    },
    '.pdf': {
        mimeType: 'application/pdf',
        matches: (bytes) => bytes.length >= 5 && bytes.subarray(0, 5).equals(Buffer.from('%PDF-')),
    },
};
function assertValidDocumentSignature(file) {
    const extension = (0, node_path_1.extname)(file.originalname).toLowerCase();
    const expected = fileSignatures[extension];
    const bytes = (0, node_fs_1.readFileSync)(file.path);
    if (!expected || file.mimetype !== expected.mimeType || !expected.matches(bytes)) {
        throw new common_1.BadRequestException('Uploaded file content does not match its allowed file type');
    }
}
function removeStoredUpload(filePath) {
    const resolvedPath = (0, node_path_1.resolve)(filePath);
    if ((0, node_path_1.dirname)(resolvedPath) !== exports.documentUploadDirectory) {
        throw new common_1.InternalServerErrorException('Stored document path is invalid');
    }
    if ((0, node_fs_1.existsSync)(resolvedPath)) {
        (0, node_fs_1.unlinkSync)(resolvedPath);
    }
}
function resolveStoredDocumentPath(storedPath) {
    const filename = (0, node_path_1.basename)(storedPath);
    if (!filename || filename !== storedPath.replace(/^.*[\\/]/, '')) {
        throw new common_1.InternalServerErrorException('Stored document path is invalid');
    }
    const resolvedPath = (0, node_path_1.resolve)(exports.documentUploadDirectory, filename);
    if ((0, node_path_1.dirname)(resolvedPath) !== exports.documentUploadDirectory) {
        throw new common_1.InternalServerErrorException('Stored document path is invalid');
    }
    return resolvedPath;
}
//# sourceMappingURL=document-storage.js.map