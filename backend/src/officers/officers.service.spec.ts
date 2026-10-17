import { ApplicationStatus } from '../common/enums/application-status.enum';
import { Role } from '../common/enums/role.enum';
import { ApplicationsRepository } from '../applications/applications.repository';
import { UsersService } from '../users/users.service';
import { OfficersService } from './officers.service';

describe('OfficersService employee IDs', () => {
  const officer = {
    user_id: 22,
    full_name: 'Sunil Sharma',
    email: 'sunil@example.com',
    phone: '9876543210',
    employee_id: 'FO-HYD-101',
    role: Role.FIELD_OFFICER,
    municipality_id: 'muni-hyd',
  };
  const usersService = {
    findAll: jest.fn(() => [officer]),
    findOne: jest.fn(() => officer),
  };
  const applicationsRepository = {
    find: jest.fn(() => [{
      assignedOfficerId: 22,
      application_status: ApplicationStatus.ASSIGNED,
    }]),
  };
  const service = new OfficersService(
    usersService as unknown as UsersService,
    applicationsRepository as unknown as ApplicationsRepository,
  );

  it('includes the persistent employee ID in officer lists', () => {
    expect(service.findAll('muni-hyd')).toEqual([
      expect.objectContaining({ id: 22, employee_id: 'FO-HYD-101', name: 'Sunil Sharma' }),
    ]);
  });

  it('includes the same persistent employee ID in individual officer details', () => {
    expect(service.findOne(22)).toEqual(
      expect.objectContaining({ id: 22, employee_id: 'FO-HYD-101' }),
    );
  });
});
