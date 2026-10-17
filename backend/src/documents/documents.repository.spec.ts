import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { JsonStore } from '../common/persistence/json-store';
import { DocumentType } from '../common/enums/document-type.enum';
import { VerificationStatus } from '../common/enums/verification-status.enum';
import { ApplicationStatus } from '../common/enums/application-status.enum';
import { DocumentsRepository } from './documents.repository';

describe('DocumentsRepository', () => {
  const originalDataFile = process.env.TRADEZO_DATA_FILE;
  let temporaryDirectory: string;

  beforeEach(() => {
    temporaryDirectory = mkdtempSync(join(tmpdir(), 'tradezo-documents-'));
    process.env.TRADEZO_DATA_FILE = join(temporaryDirectory, 'tradezo.json');
  });

  afterEach(() => {
    if (originalDataFile === undefined) delete process.env.TRADEZO_DATA_FILE;
    else process.env.TRADEZO_DATA_FILE = originalDataFile;
    rmSync(temporaryDirectory, { recursive: true, force: true });
  });

  it('persists document metadata and its application association across store reloads', () => {
    const store = new JsonStore();
    const repository = new DocumentsRepository(store);
    store.snapshot().applications.push({
      application_id: 73,
      application_ref: 'TL-TEST-000073',
      applicant_id: 25,
      full_name: 'Test Applicant',
      business_name: 'Test Shop',
      application_status: ApplicationStatus.SUBMITTED,
    });
    const created = repository.create({
      application_id: 73,
      document_type: DocumentType.AADHAR_CARD,
      file_path: 'uploads/documents/uuid.pdf',
      original_filename: 'identity-proof.pdf',
      mime_type: 'application/pdf',
      verification_status: VerificationStatus.PENDING,
    });

    const reloaded = new DocumentsRepository(new JsonStore());
    expect(new JsonStore().snapshot().applications).toContainEqual(expect.objectContaining({
      application_id: 73,
    }));
    expect(reloaded.findByApplication(73)).toMatchObject([{
      document_id: created.document_id,
      application_id: 73,
      original_filename: 'identity-proof.pdf',
      mime_type: 'application/pdf',
    }]);
  });
});
