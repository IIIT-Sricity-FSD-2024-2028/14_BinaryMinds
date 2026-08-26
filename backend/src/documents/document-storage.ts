import { existsSync, readFileSync, unlinkSync } from 'node:fs';
import { basename, dirname, extname, resolve } from 'node:path';
import { BadRequestException, InternalServerErrorException } from '@nestjs/common';

export const documentUploadDirectory = resolve(
  __dirname,
  '..',
  '..',
  'uploads',
  'documents',
);

const fileSignatures: Record<string, { mimeType: string; matches: (bytes: Buffer) => boolean }> = {
  '.png': {
    mimeType: 'image/png',
    matches: (bytes) =>
      bytes.length >= 8 &&
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

export function assertValidDocumentSignature(file: Express.Multer.File): void {
  const extension = extname(file.originalname).toLowerCase();
  const expected = fileSignatures[extension];
  const bytes = readFileSync(file.path);

  if (!expected || file.mimetype !== expected.mimeType || !expected.matches(bytes)) {
    throw new BadRequestException('Uploaded file content does not match its allowed file type');
  }
}

export function removeStoredUpload(filePath: string): void {
  const resolvedPath = resolve(filePath);
  if (dirname(resolvedPath) !== documentUploadDirectory) {
    throw new InternalServerErrorException('Stored document path is invalid');
  }

  if (existsSync(resolvedPath)) {
    unlinkSync(resolvedPath);
  }
}

export function resolveStoredDocumentPath(storedPath: string): string {
  const filename = basename(storedPath);
  if (!filename || filename !== storedPath.replace(/^.*[\\/]/, '')) {
    throw new InternalServerErrorException('Stored document path is invalid');
  }

  const resolvedPath = resolve(documentUploadDirectory, filename);
  if (dirname(resolvedPath) !== documentUploadDirectory) {
    throw new InternalServerErrorException('Stored document path is invalid');
  }

  return resolvedPath;
}
