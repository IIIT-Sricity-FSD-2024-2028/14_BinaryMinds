import { ForbiddenException } from '@nestjs/common';
import type { Request } from 'express';
import { ApplicationStatus } from '../common/enums/application-status.enum';
import { InspectionStatus } from '../common/enums/inspection-status.enum';
import { Role } from '../common/enums/role.enum';
import type { AuthenticatedUser } from '../auth/auth-session.interface';
import type { InspectionsService } from './inspections.service';
import type { ApplicationsService } from '../applications/applications.service';
import type { UsersService } from '../users/users.service';
import type { AuditLogsService } from '../audit-logs/audit-logs.service';
import { InspectionsController } from './inspections.controller';

describe('InspectionsController', () => {
  const assignment = {
    assignment_id: 12,
    application_id: 62,
    field_officer_id: 2,
  };
  const application = {
    application_id: 62,
    assignedOfficerId: 2,
    municipality_id: 'muni-hyd',
    application_status: ApplicationStatus.VERIFIED,
  };
  const officer: AuthenticatedUser = {
    userId: 2,
    email: 'officer@example.test',
    role: Role.FIELD_OFFICER,
    fullName: 'Field Officer',
    municipalityId: 'muni-hyd',
  };
  const dto = {
    assignment_id: 12,
    field_officer_id: 2,
    scheduled_date: '2026-10-20T10:30:00.000Z' as unknown as Date,
    status: 'SCHEDULED' as const,
  };

  function makeController() {
    const service = {
      findAssignment: jest.fn(() => assignment),
      create: jest.fn(() => ({ inspection_id: 21, ...dto })),
    } as unknown as InspectionsService;
    const applicationsService = {
      findOne: jest.fn(() => application),
      update: jest.fn(),
    } as unknown as ApplicationsService;
    const controller = new InspectionsController(
      service,
      { log: jest.fn() } as unknown as AuditLogsService,
      applicationsService,
      {} as UsersService,
    );
    return { controller, service };
  }

  it('schedules against the saved application assignment for its assigned Field Officer', () => {
    const { controller, service } = makeController();
    const result = controller.create(dto, { user: officer } as Request & { user: AuthenticatedUser });
    expect(result).toMatchObject({ inspection_id: 21, assignment_id: 12 });
    expect(service.create).toHaveBeenCalledWith(dto);
  });

  it('rejects an officer who does not own the application assignment', () => {
    const { controller, service } = makeController();
    expect(() => controller.create(dto, {
      user: { ...officer, userId: 3 },
    } as Request & { user: AuthenticatedUser })).toThrow(ForbiddenException);
    expect(service.create).not.toHaveBeenCalled();
  });

  it('rejects a payload that substitutes another officer for the assigned officer', () => {
    const { controller, service } = makeController();
    expect(() => controller.create({
      ...dto,
      field_officer_id: 3,
    }, { user: officer } as Request & { user: AuthenticatedUser })).toThrow(ForbiddenException);
    expect(service.create).not.toHaveBeenCalled();
  });

  it('does not allow an officer to read another officer assignment schedule', () => {
    const { controller } = makeController();
    expect(() => controller.findByAssignment(12, {
      user: { ...officer, userId: 3 },
    } as Request & { user: AuthenticatedUser })).toThrow(ForbiddenException);
  });

  it('persists the completed inspection status on its application when a report is submitted', () => {
    const savedInspection = {
      inspection_id: 21,
      assignment_id: 12,
      field_officer_id: 2,
      status: InspectionStatus.COMPLETED,
      notes: 'Inspection passed after review.',
    };
    const service = {
      findOne: jest.fn(() => ({ inspection_id: 21, assignment_id: 12, field_officer_id: 2 })),
      findAssignment: jest.fn(() => assignment),
      submitReport: jest.fn(() => savedInspection),
    } as unknown as InspectionsService;
    const applicationsService = {
      findOne: jest.fn(() => application),
      update: jest.fn(),
    } as unknown as ApplicationsService;
    const controller = new InspectionsController(
      service,
      { log: jest.fn() } as unknown as AuditLogsService,
      applicationsService,
      {} as UsersService,
    );

    const result = controller.submitReport(21, {
      notes: 'Inspection passed after review.',
      status: InspectionStatus.COMPLETED,
    }, { user: officer } as Request & { user: AuthenticatedUser });

    expect(result).toBe(savedInspection);
    expect(applicationsService.update).toHaveBeenCalledWith(62, {
      application_status: ApplicationStatus.INSPECTION_COMPLETED,
    });
  });

  it('rejects a Field Officer report when the inspection belongs to another officer', () => {
    const service = {
      findOne: jest.fn(() => ({ inspection_id: 21, assignment_id: 12, field_officer_id: 3 })),
      findAssignment: jest.fn(() => ({ ...assignment, field_officer_id: 3 })),
      submitReport: jest.fn(),
    } as unknown as InspectionsService;
    const applicationsService = {
      findOne: jest.fn(() => application),
      update: jest.fn(),
    } as unknown as ApplicationsService;
    const controller = new InspectionsController(
      service,
      { log: jest.fn() } as unknown as AuditLogsService,
      applicationsService,
      {} as UsersService,
    );

    expect(() => controller.submitReport(21, {
      notes: 'Inspection passed after review.',
      status: InspectionStatus.COMPLETED,
    }, { user: officer } as Request & { user: AuthenticatedUser })).toThrow(ForbiddenException);
    expect(service.submitReport).not.toHaveBeenCalled();
    expect(applicationsService.update).not.toHaveBeenCalled();
  });
});
