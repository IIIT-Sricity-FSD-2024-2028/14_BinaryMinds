import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { BadRequestException } from '@nestjs/common';
import { JsonStore } from '../common/persistence/json-store';
import { ApplicationStatus } from '../common/enums/application-status.enum';
import { DocumentType } from '../common/enums/document-type.enum';
import { VerificationStatus } from '../common/enums/verification-status.enum';
import { ApplicationsService } from '../applications/applications.service';
import { DocumentsRepository } from './documents.repository';
import { DocumentsService } from './documents.service';

describe('DocumentsService verification status', () => {
  const originalDataFile = process.env.TRADEZO_DATA_FILE;
  let temporaryDirectory: string;

  beforeEach(() => {
    temporaryDirectory = mkdtempSync(join(tmpdir(), 'tradezo-document-status-'));
    process.env.TRADEZO_DATA_FILE = join(temporaryDirectory, 'tradezo.json');
  });

  afterEach(() => {
    if (originalDataFile === undefined) delete process.env.TRADEZO_DATA_FILE;
    else process.env.TRADEZO_DATA_FILE = originalDataFile;
    rmSync(temporaryDirectory, { recursive: true, force: true });
  });

  it('persists a rejection reason per document and clears it when verified', () => {
    const store = new JsonStore();
    const application = {
      application_id: 73,
      application_ref: 'TL-TEST-000073',
      applicant_id: 25,
      full_name: 'Test Applicant',
      business_name: 'Test Shop',
      application_status: ApplicationStatus.DEPARTMENT_REVIEW,
    };
    store.snapshot().applications.push(application);
    const applications = {
      findOne: jest.fn(() => application),
    } as unknown as ApplicationsService;
    const documents = new DocumentsService(new DocumentsRepository(store), applications);
    const created = new DocumentsRepository(store).create({
      application_id: 73,
      document_type: DocumentType.AADHAR_CARD,
      file_path: 'uploads/documents/identity.pdf',
      original_filename: 'identity.pdf',
      mime_type: 'application/pdf',
      verification_status: VerificationStatus.PENDING,
    });

    const rejected = documents.updateVerificationStatus(
      created.document_id,
      VerificationStatus.REJECTED,
      '  Image is unreadable  ',
    );
    const reloaded = new DocumentsRepository(new JsonStore()).findById(created.document_id);
    expect(rejected).toMatchObject({
      verification_status: VerificationStatus.REJECTED,
      rejection_reason: 'Image is unreadable',
    });
    expect(reloaded).toMatchObject({
      verification_status: VerificationStatus.REJECTED,
      rejection_reason: 'Image is unreadable',
    });
    expect(application.application_status).toBe(ApplicationStatus.DEPARTMENT_REVIEW);

    documents.updateVerificationStatus(created.document_id, VerificationStatus.VERIFIED);
    expect(new DocumentsRepository(new JsonStore()).findById(created.document_id)).toMatchObject({
      verification_status: VerificationStatus.VERIFIED,
    });
    expect(new DocumentsRepository(new JsonStore()).findById(created.document_id)?.rejection_reason).toBeUndefined();
    expect(application.application_status).toBe(ApplicationStatus.DEPARTMENT_REVIEW);
  });

  it('requires a rejection reason instead of saving an incomplete rejection', () => {
    const store = new JsonStore();
    const applications = { findOne: jest.fn() } as unknown as ApplicationsService;
    const repository = new DocumentsRepository(store);
    const document = repository.create({
      application_id: 73,
      document_type: DocumentType.AADHAR_CARD,
      file_path: 'uploads/documents/identity.pdf',
      verification_status: VerificationStatus.PENDING,
    });
    const service = new DocumentsService(repository, applications);

    expect(() => service.updateVerificationStatus(
      document.document_id,
      VerificationStatus.REJECTED,
      '   ',
    )).toThrow(BadRequestException);
    expect(repository.findById(document.document_id)?.verification_status).toBe(VerificationStatus.PENDING);
  });
});
