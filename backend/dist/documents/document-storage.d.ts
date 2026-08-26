export declare const documentUploadDirectory: string;
export declare function assertValidDocumentSignature(file: Express.Multer.File): void;
export declare function removeStoredUpload(filePath: string): void;
export declare function resolveStoredDocumentPath(storedPath: string): string;
