import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ApplicationsRepository } from '../applications/applications.repository';
import { ApplicationsService } from '../applications/applications.service';
import { ApplicationStatus } from '../common/enums/application-status.enum';
import { Role } from '../common/enums/role.enum';
import { JsonStore } from '../common/persistence/json-store';
import { ReviewStatus } from '../common/enums/review-status.enum';
import { InspectionStatus } from '../common/enums/inspection-status.enum';
import { UsersService } from '../users/users.service';
import { DepartmentReviewsController } from './department-reviews.controller';
import { DepartmentReviewsRepository } from './department-reviews.repository';
import { DepartmentReviewsService } from './department-reviews.service';

describe('DepartmentReviewsService decisions', () => {
  const originalDataFile = process.env.TRADEZO_DATA_FILE;
  let temporaryDirectory: string;

  beforeEach(() => {
    temporaryDirectory = mkdtempSync(join(tmpdir(), 'tradezo-review-'));
    process.env.TRADEZO_DATA_FILE = join(temporaryDirectory, 'tradezo.json');
  });

  afterEach(() => {
    if (originalDataFile === undefined) delete process.env.TRADEZO_DATA_FILE;
    else process.env.TRADEZO_DATA_FILE = originalDataFile;
    rmSync(temporaryDirectory, { recursive: true, force: true });
  });

  function createService() {
    const store = new JsonStore();
    const application = {
      application_id: 62,
      municipality_id: 'muni-hyd',
      application_status: ApplicationStatus.INSPECTION_SCHEDULED,
    };
    store.snapshot().applications.push(application as any);
    store.save();

    const applicationsService = new ApplicationsService(
      new ApplicationsRepository(store),
      {} as UsersService,
      {} as any,
      {} as any,
    );
    const usersService = {
      findOne: jest.fn(() => ({ user_id: 3, role: Role.DEPARTMENT_OFFICER })),
    } as unknown as UsersService;
    const repository = new DepartmentReviewsRepository(store);
    const service = new DepartmentReviewsService(repository, applicationsService, usersService);
    return { service, application, applicationsService };
  }

  it('advances an inspected application, persists approval and reloads the decision', () => {
    const { service, applicationsService } = createService();

    const controller = new DepartmentReviewsController(
      service,
      applicationsService,
      { findByApplication: jest.fn(() => [{ status: InspectionStatus.COMPLETED }]) } as any,
    );
    const result = controller.decide(62, {
      status: ReviewStatus.APPROVED,
      comments: 'Inspection and documents reviewed.',
    }, {
      user: { userId: 3, municipalityId: 'muni-hyd', role: Role.DEPARTMENT_OFFICER },
    } as any);
    const reloaded = new DepartmentReviewsRepository(new JsonStore()).findByApplication(62)[0];

    expect(result.application.application_status).toBe(ApplicationStatus.APPROVED);
    expect(result.review).toMatchObject({
      application_id: 62,
      reviewer_id: 3,
      status: ReviewStatus.APPROVED,
      comments: 'Inspection and documents reviewed.',
    });
    expect(result.review.reviewed_at).toBeInstanceOf(Date);
    expect(reloaded).toMatchObject(result.review);
    expect(reloaded.reviewed_at).toBeInstanceOf(Date);
    expect(new JsonStore().snapshot().applications[0].application_status).toBe(ApplicationStatus.APPROVED);
  });

  it('persists a rejection and does not allow another decision after the final status', () => {
    const { service } = createService();
    service.decide(62, 3, ReviewStatus.REJECTED, 'Required evidence is incomplete.');

    expect(() => service.decide(62, 3, ReviewStatus.APPROVED, 'Changed decision.'))
      .toThrow('not eligible for final review');
    expect(new DepartmentReviewsRepository(new JsonStore()).findByApplication(62)[0])
      .toMatchObject({ status: ReviewStatus.REJECTED, comments: 'Required evidence is incomplete.' });
    expect(new JsonStore().snapshot().applications[0].application_status).toBe(ApplicationStatus.REJECTED);
  });

  it('rejects a reviewer who is not a Department Officer', () => {
    const { service } = createService();
    const usersService = (service as any).usersService as UsersService;
    jest.spyOn(usersService, 'findOne').mockReturnValue({
      user_id: 5,
      role: Role.FIELD_OFFICER,
    } as any);

    expect(() => service.decide(62, 5, ReviewStatus.APPROVED, 'Reviewed.'))
      .toThrow('Only a Department Officer can decide this review');
  });

  it('rejects requests outside the officer municipality and applications without a completed inspection', () => {
    const applicationsService = {
      findOne: jest.fn(() => ({ application_id: 62, municipality_id: 'muni-hyd' })),
    };
    const inspectionService = {
      findByApplication: jest.fn((): { status: InspectionStatus }[] => []),
    };
    const service = { decide: jest.fn() };
    const controller = new DepartmentReviewsController(
      service as any,
      applicationsService as any,
      inspectionService as any,
    );
    const decision = {
      status: ReviewStatus.APPROVED,
      comments: 'Reviewed and approved.',
    };

    expect(() => controller.decide(62, decision, {
      user: { userId: 3, municipalityId: 'muni-other', role: Role.DEPARTMENT_OFFICER },
    } as any)).toThrow('Access denied to applications outside your municipality');
    expect(() => controller.decide(62, decision, {
      user: { userId: 3, municipalityId: 'muni-hyd', role: Role.DEPARTMENT_OFFICER },
    } as any)).toThrow('A completed Field Officer inspection report is required');
    expect(service.decide).not.toHaveBeenCalled();

    inspectionService.findByApplication.mockReturnValue([{ status: InspectionStatus.COMPLETED }]);
    service.decide.mockReturnValue({ saved: true });
    expect(controller.decide(62, decision, {
      user: { userId: 3, municipalityId: 'muni-hyd', role: Role.DEPARTMENT_OFFICER },
    } as any)).toEqual({ saved: true });
    expect(service.decide).toHaveBeenCalledWith(62, 3, ReviewStatus.APPROVED, decision.comments);
  });
});
