import { validate } from 'class-validator';
import { ChangePasswordDto } from './change-password.dto';
import { RegisterApplicantDto } from './register-applicant.dto';

describe('password strength validation', () => {
  const registrationWithPassword = (password: string) =>
    Object.assign(new RegisterApplicantDto(), {
      full_name: 'Test Applicant',
      email: 'test@example.com',
      phone: '1234567890',
      password,
    });

  const passwordChangeWithPassword = (newPassword: string) =>
    Object.assign(new ChangePasswordDto(), {
      currentPassword: 'CurrentPassword1!',
      newPassword,
    });

  it.each(['000000', '123456', 'abcdef'])(
    'rejects weak registration password %s',
    async (password) => {
      expect(await validate(registrationWithPassword(password))).not.toHaveLength(0);
    },
  );

  it('accepts a registration password containing letters, numbers, and a special character', async () => {
    expect(await validate(registrationWithPassword('abc123!'))).toHaveLength(0);
  });

  it.each(['000000', '123456', 'abcdef'])(
    'rejects weak changed password %s',
    async (password) => {
      expect(await validate(passwordChangeWithPassword(password))).not.toHaveLength(0);
    },
  );

  it('accepts a changed password containing letters, numbers, and a special character', async () => {
    expect(await validate(passwordChangeWithPassword('abc123!'))).toHaveLength(0);
  });
});
