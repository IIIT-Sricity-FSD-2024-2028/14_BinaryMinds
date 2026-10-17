import { mkdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ForbiddenException, NotFoundException, StreamableFile } from '@nestjs/common';
import type { Request } from 'express';
import { AuthenticatedUser } from '../auth/auth-session.interface';
import { Role } from '../common/enums/role.enum';
import { DocumentType } from '../common/enums/document-type.enum';
import { VerificationStatus } from '../common/enums/verification-status.enum';
import { ApplicationsService } from '../applications/applications.service';
import { documentUploadDirectory } from './document-storage';
import { Document } from './document.interface';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';

describe('DocumentsController file access', () => {
  const filename = `controller-test-${Date.now()}.pdf`;
  const filePath = join(documentUploadDirectory, filename);
  const document: Document = {
    document_id: 91,
    application_id: 73,
    document_type: DocumentType.AADHAR_CARD,
    file_path: `uploads/documents/${filename}`,
    original_filename: 'identity-proof.pdf',
    mime_type: 'application/pdf',
    verification_status: VerificationStatus.PENDING,
  };
  const application = {
    application_id: 73,
    applicant_id: 25,
    municipality_id: 'muni-test',
    assignedOfficerId: 32,
  };
  let controller: DocumentsController;

  beforeAll(() => {
    mkdirSync(documentUploadDirectory, { recursive: true });
    writeFileSync(filePath, '%PDF-1.4\nTradeZo document test\n');
    controller = new DocumentsController(
      { findOne: jest.fn(() => document) } as unknown as DocumentsService,
      { findOne: jest.fn(() => application) } as unknown as ApplicationsService,
    );
  });

  afterAll(() => {
    unlinkSync(filePath);
  });

  it('streams the actual file to the assigned officer with a safe inline filename', async () => {
    const officer: AuthenticatedUser = {
      userId: 32,
      email: 'officer@example.test',
      role: Role.FIELD_OFFICER,
      fullName: 'Test Officer',
      municipalityId: 'muni-test',
    };

    const response = controller.viewFile(document.document_id, { user: officer } as Request & { user: AuthenticatedUser });
    expect(response).toBeInstanceOf(StreamableFile);
    expect(response.getHeaders()).toMatchObject({
      type: 'application/pdf',
      disposition: expect.stringContaining('inline; filename="identity-proof.pdf"'),
    });

    const chunks: Buffer[] = [];
    for await (const chunk of response.getStream()) chunks.push(Buffer.from(chunk));
    expect(Buffer.concat(chunks).toString()).toContain('TradeZo document test');
  });

  it('rejects an officer who is not assigned to the application', () => {
    const otherOfficer: AuthenticatedUser = {
      userId: 33,
      email: 'other@example.test',
      role: Role.FIELD_OFFICER,
      fullName: 'Other Officer',
      municipalityId: 'muni-test',
    };

    expect(() => controller.viewFile(document.document_id, { user: otherOfficer } as Request & { user: AuthenticatedUser }))
      .toThrow(ForbiddenException);
  });

  it("does not allow an applicant to attach a file to another applicant's application", () => {
    const create = jest.fn();
    const uploadController = new DocumentsController(
      { create } as unknown as DocumentsService,
      { findOne: jest.fn(() => application) } as unknown as ApplicationsService,
    );
    const applicant: AuthenticatedUser = {
      userId: 26,
      email: 'other-applicant@example.test',
      role: Role.APPLICANT,
      fullName: 'Other Applicant',
    };

    expect(() => uploadController.create(
      { application_id: application.application_id, document_type: DocumentType.AADHAR_CARD },
      {
        filename: 'unauthorized.pdf',
        originalname: 'unauthorized.pdf',
        mimetype: 'application/pdf',
      } as Express.Multer.File,
      { user: applicant } as Request & { user: AuthenticatedUser },
    )).toThrow(ForbiddenException);
    expect(create).not.toHaveBeenCalled();
  });

  it('does not serve files outside the private upload directory', () => {
    const traversalDocument = { ...document, file_path: '../../package.json' };
    const traversalController = new DocumentsController(
      { findOne: jest.fn(() => traversalDocument) } as unknown as DocumentsService,
      { findOne: jest.fn(() => application) } as unknown as ApplicationsService,
    );
    const officer: AuthenticatedUser = {
      userId: 32,
      email: 'officer@example.test',
      role: Role.FIELD_OFFICER,
      fullName: 'Test Officer',
      municipalityId: 'muni-test',
    };

    expect(() => traversalController.viewFile(document.document_id, { user: officer } as Request & { user: AuthenticatedUser }))
      .toThrow(NotFoundException);
  });

  it('allows only an authorized Department Officer to update document status', () => {
    const updateVerificationStatus = jest.fn((id, status, rejectionReason) => ({
      ...document,
      document_id: id,
      verification_status: status,
      rejection_reason: rejectionReason,
    }));
    const statusController = new DocumentsController(
      {
        findOne: jest.fn(() => document),
        updateVerificationStatus,
      } as unknown as DocumentsService,
      { findOne: jest.fn(() => application) } as unknown as ApplicationsService,
    );
    const departmentOfficer: AuthenticatedUser = {
      userId: 40,
      email: 'department@example.test',
      role: Role.DEPARTMENT_OFFICER,
      fullName: 'Department Officer',
      municipalityId: 'muni-test',
    };

    expect(statusController.updateStatus(document.document_id, {
      status: VerificationStatus.REJECTED,
      rejection_reason: 'Image is unreadable',
    }, { user: departmentOfficer } as Request & { user: AuthenticatedUser })).toMatchObject({
      verification_status: VerificationStatus.REJECTED,
      rejection_reason: 'Image is unreadable',
    });
    expect(updateVerificationStatus).toHaveBeenCalledWith(
      document.document_id,
      VerificationStatus.REJECTED,
      'Image is unreadable',
    );
    expect(() => statusController.updateStatus(document.document_id, {
      status: VerificationStatus.VERIFIED,
    }, {
      user: { ...departmentOfficer, municipalityId: 'other-municipality' },
    } as Request & { user: AuthenticatedUser })).toThrow(ForbiddenException);
    expect(() => statusController.updateStatus(document.document_id, {
      status: VerificationStatus.VERIFIED,
    }, {
      user: {
        ...departmentOfficer,
        userId: 32,
        role: Role.FIELD_OFFICER,
      },
    } as Request & { user: AuthenticatedUser })).toThrow(ForbiddenException);
  });
});
