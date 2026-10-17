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
