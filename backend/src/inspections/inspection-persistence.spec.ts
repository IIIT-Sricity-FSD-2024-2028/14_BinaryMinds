import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { JsonStore } from '../common/persistence/json-store';
import { AssignmentStatus } from '../common/enums/assignment-status.enum';
import { InspectionStatus } from '../common/enums/inspection-status.enum';
import { FieldOfficerAssignmentsRepository } from '../field-officer-assignments/field-officer-assignments.repository';
import { FieldOfficerAssignmentsService } from '../field-officer-assignments/field-officer-assignments.service';
import { ApplicationsController } from '../applications/applications.controller';
import { Role } from '../common/enums/role.enum';
import { ApplicationStatus } from '../common/enums/application-status.enum';
import type { AuthenticatedUser } from '../auth/auth-session.interface';
import type { Request } from 'express';
import type { ApplicationsService } from '../applications/applications.service';
import type { UsersService } from '../users/users.service';
import type { AuditLogsService } from '../audit-logs/audit-logs.service';
import { InspectionsController } from './inspections.controller';
import { InspectionsService } from './inspections.service';
import { InspectionsRepository } from './inspections.repository';

describe('inspection workflow persistence', () => {
  const originalDataFile = process.env.TRADEZO_DATA_FILE;
  let temporaryDirectory: string;

  beforeEach(() => {
    temporaryDirectory = mkdtempSync(join(tmpdir(), 'tradezo-inspection-'));
    process.env.TRADEZO_DATA_FILE = join(temporaryDirectory, 'tradezo.json');
  });

  afterEach(() => {
    if (originalDataFile === undefined) delete process.env.TRADEZO_DATA_FILE;
    else process.env.TRADEZO_DATA_FILE = originalDataFile;
    rmSync(temporaryDirectory, { recursive: true, force: true });
  });

  it('persists assignment and inspection IDs and schedule date across JSON store reloads', () => {
    const assignments = new FieldOfficerAssignmentsRepository(new JsonStore());
    const assignment = assignments.create({
      application_id: 62,
      field_officer_id: 2,
      assigned_by: 3,
      status: AssignmentStatus.PENDING,
      deadline: new Date('2026-10-27T00:00:00.000Z'),
    });
    const scheduledDate = new Date('2026-10-20T10:30:00.000Z');
    const inspections = new InspectionsRepository(new JsonStore());
    const inspection = inspections.create({
      assignment_id: assignment.assignment_id,
      field_officer_id: 2,
      scheduled_date: scheduledDate,
      status: InspectionStatus.SCHEDULED,
    });

    const reloadedAssignments = new FieldOfficerAssignmentsRepository(new JsonStore());
    const reloadedInspections = new InspectionsRepository(new JsonStore());
    expect(reloadedAssignments.findByApplication(62)).toMatchObject([{
      assignment_id: 1,
      application_id: 62,
      field_officer_id: 2,
      assigned_by: 3,
    }]);
    expect(reloadedInspections.findByAssignment(assignment.assignment_id)).toMatchObject([{
      inspection_id: inspection.inspection_id,
      assignment_id: assignment.assignment_id,
      field_officer_id: 2,
      scheduled_date: scheduledDate,
      status: InspectionStatus.SCHEDULED,
    }]);
  });

  it('assigns via the application workflow, schedules for that officer, and reloads the saved inspection', () => {
    const store = new JsonStore();
    const app = {
      application_id: 62,
      application_ref: 'TL-2026-000062',
      municipality_id: 'muni-hyd',
      application_status: ApplicationStatus.SUBMITTED,
      assignedOfficerId: null as number | null,
    };
    const applicationsService = {
      findOne: jest.fn(() => app),
      update: jest.fn((_id: number, changes: Partial<typeof app>) => {
        Object.assign(app, changes);
        return app;
      }),
      assignToOfficer: jest.fn((_id: number, officerId: number) => {
        app.assignedOfficerId = officerId;
        app.application_status = ApplicationStatus.ASSIGNED;
        return app;
      }),
    } as unknown as ApplicationsService;
    const commissioner: AuthenticatedUser = {
      userId: 1,
      email: 'commissioner@example.test',
      role: Role.MUNICIPAL_COMMISSIONER,
      fullName: 'Commissioner',
      municipalityId: 'muni-hyd',
    };
    const fieldOfficer: AuthenticatedUser = {
      userId: 2,
      email: 'officer@example.test',
      role: Role.FIELD_OFFICER,
      fullName: 'Field Officer',
      municipalityId: 'muni-hyd',
    };
    const usersService = {
      findOne: jest.fn((id: number) => id === 2
        ? { user_id: 2, role: Role.FIELD_OFFICER, municipality_id: 'muni-hyd' }
        : { user_id: 1, role: Role.MUNICIPAL_COMMISSIONER, municipality_id: 'muni-hyd' }),
    } as unknown as UsersService;
    const assignmentRepository = new FieldOfficerAssignmentsRepository(store);
    const assignmentService = new FieldOfficerAssignmentsService(
      assignmentRepository,
      applicationsService,
      usersService,
    );
    const assignController = new ApplicationsController(
      applicationsService,
      { log: jest.fn() } as unknown as AuditLogsService,
      usersService,
      assignmentService,
    );

    assignController.assign(62, { officerId: 2 }, {
      user: commissioner,
    } as Request & { user: AuthenticatedUser });
    const assignment = assignmentRepository.findByApplication(62)[0];
    expect(assignment).toMatchObject({
      application_id: 62,
      field_officer_id: 2,
      assigned_by: 1,
    });

    const inspectionService = new InspectionsService(
      new InspectionsRepository(store),
      assignmentService,
    );
    const inspectionController = new InspectionsController(
      inspectionService,
      { log: jest.fn() } as unknown as AuditLogsService,
      applicationsService,
      usersService,
    );
    const scheduledDate = '2026-10-20T10:30:00.000Z';
    app.application_status = ApplicationStatus.VERIFIED;
    const created = inspectionController.create({
      assignment_id: assignment.assignment_id,
      field_officer_id: 2,
      scheduled_date: scheduledDate as unknown as Date,
      status: InspectionStatus.SCHEDULED,
    }, { user: fieldOfficer } as Request & { user: AuthenticatedUser });

    const reloaded = new InspectionsRepository(new JsonStore())
      .findByAssignment(assignment.assignment_id);
    expect(reloaded).toMatchObject([{
      inspection_id: created.inspection_id,
      assignment_id: assignment.assignment_id,
      scheduled_date: new Date(scheduledDate),
      status: InspectionStatus.SCHEDULED,
    }]);
    expect(app.application_status).toBe(ApplicationStatus.INSPECTION_SCHEDULED);
  });

  it('recovers only the Field Officer already recorded on a legacy application', () => {
    const store = new JsonStore();
    store.snapshot().applications.push({
      application_id: 62,
      application_ref: 'TL-2026-000062',
      applicant_id: 9,
      full_name: 'Applicant',
      business_name: 'Shop',
      municipality_id: 'muni-hyd',
      application_status: ApplicationStatus.VERIFIED,
      assignedOfficerId: 2,
    });
    store.save();
    const apps = {
      findOne: jest.fn((id: number) => store.snapshot().applications.find((row) => row.application_id === id)!),
    } as unknown as ApplicationsService;
    const users = {
      findOne: jest.fn((id: number) => store.snapshot().users.find((row) => row.user_id === id)!),
    } as unknown as UsersService;
    const repository = new FieldOfficerAssignmentsRepository(store);
    const service = new FieldOfficerAssignmentsService(repository, apps, users);

    const recovered = service.recoverForFieldOfficer(62, 2);
    expect(recovered).toMatchObject({
      application_id: 62,
      field_officer_id: 2,
      status: 'IN_PROGRESS',
      recovered_from_application_assignment: true,
    });
    expect(recovered.assigned_by).toBeUndefined();
    expect(new FieldOfficerAssignmentsRepository(new JsonStore()).findByApplication(62)).toHaveLength(1);
    expect(() => service.recoverForFieldOfficer(62, 3)).toThrow();
  });
});
