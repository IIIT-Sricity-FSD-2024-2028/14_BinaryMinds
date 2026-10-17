import { BadRequestException, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { Role } from '../common/enums/role.enum';
import { AuthenticatedUser } from '../auth/auth-session.interface';
import { verifyPassword } from '../auth/password.util';
import { User } from './user.interface';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController Field Officer profile', () => {
  const storedUser: User = {
    user_id: 17,
    full_name: 'Old Name',
    email: 'old@example.com',
    phone: '1234567890',
    employee_id: 'FO-001',
    password_hash: 'secret-hash',
    role: Role.FIELD_OFFICER,
    municipality_id: 'muni-1',
    department: 'Licensing',
  };
  const authenticatedUser: AuthenticatedUser = {
    userId: 17,
    role: Role.FIELD_OFFICER,
    municipalityId: 'muni-1',
    fullName: 'Old Name',
  };

  let controller: UsersController;
  let usersService: jest.Mocked<Pick<UsersService, 'findOne' | 'update'>>;

  beforeEach(() => {
    usersService = {
      findOne: jest.fn().mockReturnValue(storedUser),
      update: jest.fn((id, update) => ({ ...storedUser, ...update, user_id: id })),
    };
    controller = new UsersController(
      usersService as unknown as UsersService,
      { log: jest.fn() } as unknown as AuditLogsService,
    );
  });

  describe('UsersController applicant password change', () => {
    const applicant: User = {
      user_id: 29,
      full_name: 'Applicant Name',
      email: 'applicant@example.com',
      phone: '1234567890',
      password_hash: 'OldPassword1',
      role: Role.APPLICANT,
    };
    const request = {
      user: {
        userId: applicant.user_id,
        role: Role.APPLICANT,
        fullName: applicant.full_name,
      },
    } as Request & { user: AuthenticatedUser };

    let controller: UsersController;
    let usersService: jest.Mocked<Pick<UsersService, 'findOne' | 'update'>>;

    beforeEach(() => {
      usersService = {
        findOne: jest.fn().mockReturnValue(applicant),
        update: jest.fn((id, update) => ({ ...applicant, ...update, user_id: id })),
      };
      controller = new UsersController(
        usersService as unknown as UsersService,
        { log: jest.fn() } as unknown as AuditLogsService,
      );
    });

    it('stores a salted password hash after verifying the current password', () => {
      const result = controller.changeOwnPassword(
        { currentPassword: 'OldPassword1', newPassword: 'NewPassword2' },
        request,
      );
      const savedPassword = usersService.update.mock.calls[0][1].password_hash!;

      expect(result).toEqual({ success: true, message: 'Password updated successfully.' });
      expect(savedPassword).not.toBe('NewPassword2');
      expect(savedPassword).toMatch(/^scrypt:/);
      expect(verifyPassword('NewPassword2', savedPassword)).toBe(true);
      expect(verifyPassword('OldPassword1', savedPassword)).toBe(false);
    });

    it('does not change the password when the current password is incorrect', () => {
      expect(() => controller.changeOwnPassword(
        { currentPassword: 'wrong-password', newPassword: 'NewPassword2' },
        request,
      )).toThrow(UnauthorizedException);
      expect(usersService.update).not.toHaveBeenCalled();
    });

    it('rejects a new password that matches the current password', () => {
      expect(() => controller.changeOwnPassword(
        { currentPassword: 'OldPassword1', newPassword: 'OldPassword1' },
        request,
      )).toThrow(BadRequestException);
      expect(usersService.update).not.toHaveBeenCalled();
    });

    it('does not allow a non-applicant account to change its password through this endpoint', () => {
      usersService.findOne.mockReturnValue({ ...applicant, role: Role.FIELD_OFFICER });
      expect(() => controller.changeOwnPassword(
        { currentPassword: 'OldPassword1', newPassword: 'NewPassword2' },
        request,
      )).toThrow(UnauthorizedException);
      expect(usersService.update).not.toHaveBeenCalled();
    });
  });

  it('updates only personal contact fields and does not return the password hash', () => {
    const request = { user: authenticatedUser } as Request & { user: AuthenticatedUser };
    const result = controller.update(
      17,
      {
        full_name: 'Updated Name',
        email: 'new@example.com',
        phone: '0987654321',
        role: Role.APPLICANT,
        municipality_id: 'muni-other',
        password_hash: 'attempted-password',
        department: 'Changed Department',
      } as never,
      request,
    ) as User;

    expect(usersService.update).toHaveBeenCalledWith(17, {
      full_name: 'Updated Name',
      email: 'new@example.com',
      phone: '0987654321',
    });
    expect(result).toMatchObject({
      full_name: 'Updated Name',
      email: 'new@example.com',
      phone: '0987654321',
      role: Role.FIELD_OFFICER,
      municipality_id: 'muni-1',
    });
    expect(result).not.toHaveProperty('password_hash');
  });

  it('rejects attempts to update another Field Officer', () => {
    const request = {
      user: { ...authenticatedUser, userId: 18 },
    } as Request & { user: AuthenticatedUser };

    expect(() => controller.update(17, { full_name: 'Intruder' }, request)).toThrow(
      ForbiddenException,
    );
    expect(usersService.update).not.toHaveBeenCalled();
  });

  it('does not include password hashes in the current-user profile response', () => {
    const request = { user: authenticatedUser } as Request & { user: AuthenticatedUser };

    expect(controller.getProfile(request)).not.toHaveProperty('password_hash');
  });
});
