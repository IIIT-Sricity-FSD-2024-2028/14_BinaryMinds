import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ApplicationsRepository } from './applications.repository';
import { ApplicationsService } from './applications.service';
import { ApplicationsController } from './applications.controller';
import { JsonStore } from '../common/persistence/json-store';
import { UsersService } from '../users/users.service';
import { MunicipalitiesService } from '../municipalities/municipalities.service';
import { OfficersService } from '../officers/officers.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { Role } from '../common/enums/role.enum';
import type { Request } from 'express';
import { AuthenticatedUser } from '../auth/auth-session.interface';
import { FieldOfficerAssignmentsService } from '../field-officer-assignments/field-officer-assignments.service';
import { ApplicationStatus } from '../common/enums/application-status.enum';
import { LicenseStatus } from '../common/enums/license-status.enum';
import { PaymentStatus } from '../common/enums/payment-status.enum';
import { ConflictException } from '@nestjs/common';

describe('ApplicationsService', () => {
  const originalDataFile = process.env.TRADEZO_DATA_FILE;
  let temporaryDirectory: string;

  beforeEach(() => {
    temporaryDirectory = mkdtempSync(join(tmpdir(), 'tradezo-applications-'));
    process.env.TRADEZO_DATA_FILE = join(temporaryDirectory, 'tradezo.json');
  });

  afterEach(() => {
    if (originalDataFile === undefined) delete process.env.TRADEZO_DATA_FILE;
    else process.env.TRADEZO_DATA_FILE = originalDataFile;
    rmSync(temporaryDirectory, { recursive: true, force: true });
  });

  function createHarness() {
    const store = new JsonStore();
    const repository = new ApplicationsRepository(store);
    const usersService = {
      findOne: jest.fn((id: number) => ({ user_id: id })),
    } as unknown as UsersService;
    const municipalitiesService = {
      resolveMunicipality: jest.fn((_state: string, _city: string, requestedId?: string) => ({
        municipality_id: requestedId || 'muni-test',
        name: requestedId || 'Test Municipality',
      })),
    } as unknown as MunicipalitiesService;
    const service = new ApplicationsService(
      repository,
      usersService,
      municipalitiesService,
      {} as OfficersService,
    );
    return { store, repository, service, usersService };
  }

  function createApplicantApplication(
    service: ApplicationsService,
    businessName = 'Test Shop',
    municipalityId = 'muni-test',
  ) {
    return service.createSimple(
      {
        applicantName: 'Application Test',
        businessName,
        businessType: 'Retail Shop',
        tradeCategory: 'Retail Shop',
        city: 'Test City',
        state: 'Test State',
        municipality_id: municipalityId,
      },
      41,
    );
  }

  it('blocks the same business and municipality while an application is being processed', () => {
    const { service } = createHarness();
    createApplicantApplication(service);

    expect(() => createApplicantApplication(service, ' test   shop ', 'MUNI-TEST')).toThrow(
      ConflictException,
    );
  });

  it('blocks the same business and municipality when an approved application has a valid license', () => {
    const { service, repository, store } = createHarness();
    const existing = createApplicantApplication(service);
    repository.update(existing.application_id, { application_status: ApplicationStatus.APPROVED });
    store.snapshot().licenses.push({
      license_id: 1,
      application_id: existing.application_id,
      license_number: 'LIC-TEST',
      issued_by: 3,
      issued_date: new Date(),
      expiry_date: new Date(Date.now() + 86_400_000),
      status: LicenseStatus.ACTIVE,
    });

    expect(() => createApplicantApplication(service)).toThrow(ConflictException);
  });

  it('allows reapplication after rejection', () => {
    const { service, repository } = createHarness();
    const existing = createApplicantApplication(service);
    repository.update(existing.application_id, { application_status: ApplicationStatus.REJECTED });

    expect(createApplicantApplication(service).application_id).not.toBe(existing.application_id);
  });

  it('allows reapplication when the approved license has expired', () => {
    const { service, repository, store } = createHarness();
    const existing = createApplicantApplication(service);
    repository.update(existing.application_id, { application_status: ApplicationStatus.APPROVED });
    store.snapshot().licenses.push({
      license_id: 1,
      application_id: existing.application_id,
      license_number: 'LIC-TEST',
      issued_by: 3,
      issued_date: new Date('2020-01-01T00:00:00.000Z'),
      expiry_date: new Date('2021-01-01T00:00:00.000Z'),
      status: LicenseStatus.ACTIVE,
    });

    expect(createApplicantApplication(service).application_id).not.toBe(existing.application_id);
  });

  it('allows a different business for the same Applicant and municipality', () => {
    const { service } = createHarness();
    createApplicantApplication(service, 'Test Shop');

    expect(createApplicantApplication(service, 'Second Shop').business_name).toBe('Second Shop');
  });

  it('allows the same business in a different municipality', () => {
    const { service } = createHarness();
    createApplicantApplication(service, 'Test Shop', 'muni-test');

    expect(createApplicantApplication(service, 'Test Shop', 'muni-other').municipality_id).toBe(
      'muni-other',
    );
  });

  it('does not use an existing payment record to block a different business', () => {
    const { service, store } = createHarness();
    const existing = createApplicantApplication(service, 'First Shop');
    store.snapshot().payments.push({
      payment_id: 1,
      application_id: existing.application_id,
      amount: 1510,
      payment_status: PaymentStatus.COMPLETED,
      payment_date: new Date(),
    });

    expect(createApplicantApplication(service, 'Second Shop').business_name).toBe('Second Shop');
  });

  it('rejects a direct Applicant creation request that duplicates a processing application', () => {
    const { service, usersService } = createHarness();
    const controller = new ApplicationsController(
      service,
      { log: jest.fn() } as unknown as AuditLogsService,
      usersService,
      { createForAssignedApplication: jest.fn() } as unknown as FieldOfficerAssignmentsService,
    );
    const applicant: AuthenticatedUser = {
      userId: 41,
      email: 'applicant@example.test',
      role: Role.APPLICANT,
      fullName: 'Application Test',
    };
    const request = { user: applicant } as Request & { user: AuthenticatedUser };
    const body = {
      businessName: 'Test Shop',
      municipalityId: 'muni-test',
      city: 'Test City',
      state: 'Test State',
    };
    controller.create(body, request);

    expect(() => controller.create({ ...body, applicant_id: 99 }, request)).toThrow(
      ConflictException,
    );
    expect(jest.mocked(usersService.findOne)).toHaveBeenCalledWith(41);
  });

  it('persists applicant form fields and returns them from the saved application record', () => {
    const store = new JsonStore();
    const repository = new ApplicationsRepository(store);
    const usersService = { findOne: jest.fn(() => ({ user_id: 41 })) } as unknown as UsersService;
    const municipalitiesService = {
      resolveMunicipality: jest.fn(() => ({ municipality_id: 'muni-test', name: 'Test Municipality' })),
    } as unknown as MunicipalitiesService;
    const officersService = {} as OfficersService;
    const applicationsService = new ApplicationsService(
      repository,
      usersService,
      municipalitiesService,
      officersService,
    );
    const controller = new ApplicationsController(
      applicationsService,
      { log: jest.fn() } as unknown as AuditLogsService,
      usersService,
      { createForAssignedApplication: jest.fn() } as unknown as FieldOfficerAssignmentsService,
    );
    const applicant: AuthenticatedUser = {
      userId: 41,
      email: 'applicant@example.test',
      role: Role.APPLICANT,
      fullName: 'Application Test',
    };
    const createdResponse = controller.create({
      applicantName: 'Application Test',
      father_name: 'Father Test',
      mother_name: 'Mother Test',
      shop_area: '250',
      businessName: 'Test Shop',
      businessType: 'Retail Shop',
      tradeCategory: 'Retail Shop',
      city: 'Test City',
      state: 'Test State',
    }, { user: applicant } as Request & { user: AuthenticatedUser });
    const created = createdResponse.data;

    const savedResponse = controller.findOne(created.application_id, {
      user: { ...applicant, role: Role.PLATFORM_ADMIN },
    } as Request & { user: AuthenticatedUser });
    const saved = savedResponse.data;

    expect(saved).toMatchObject({
      father_name: 'Father Test',
      mother_name: 'Mother Test',
      shop_area: '250',
      trade_category: 'Retail Shop',
      business_type: 'Retail Shop',
    });
  });

  it('allows an applicant to backfill their own missing application details', () => {
    const store = new JsonStore();
    const repository = new ApplicationsRepository(store);
    const usersService = { findOne: jest.fn(() => ({ user_id: 41 })) } as unknown as UsersService;
    const municipalitiesService = {
      resolveMunicipality: jest.fn(() => ({ municipality_id: 'muni-test', name: 'Test Municipality' })),
    } as unknown as MunicipalitiesService;
    const applicationsService = new ApplicationsService(
      repository,
      usersService,
      municipalitiesService,
      {} as OfficersService,
    );
    const controller = new ApplicationsController(
      applicationsService,
      { log: jest.fn() } as unknown as AuditLogsService,
      usersService,
      { createForAssignedApplication: jest.fn() } as unknown as FieldOfficerAssignmentsService,
    );
    const applicant: AuthenticatedUser = {
      userId: 41,
      email: 'applicant@example.test',
      role: Role.APPLICANT,
      fullName: 'Application Test',
    };
    const created = controller.create({
      applicantName: 'Application Test',
      businessName: 'Test Shop',
      businessType: 'Retail Shop',
      tradeCategory: 'Retail Shop',
      city: 'Test City',
      state: 'Test State',
    }, { user: applicant } as Request & { user: AuthenticatedUser }).data;

    const updated = controller.update(created.application_id, {
      father_name: 'Father Test',
      mother_name: 'Mother Test',
      shop_area: '250',
    }, { user: applicant } as Request & { user: AuthenticatedUser }).data;

    expect(updated).toMatchObject({
      father_name: 'Father Test',
      mother_name: 'Mother Test',
      shop_area: '250',
    });
  });
});
