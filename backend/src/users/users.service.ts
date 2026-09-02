import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { User } from './user.interface';
import { Role } from '../common/enums/role.enum';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  findAll(): User[] {
    return this.usersRepository.find();
  }

  findOne(id: number): User {
    const user = this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  findByEmail(email: string): User {
    const user = this.usersRepository.findByEmail(email);
    if (!user) {
      throw new NotFoundException(`User with email ${email} not found`);
    }
    return user;
  }

  findByLoginIdentifier(identifier: string): User {
    const normalizedIdentifier = identifier.trim();
    const user = normalizedIdentifier.includes('@')
      ? this.usersRepository.findByEmail(normalizedIdentifier)
      : this.usersRepository.findByPhone(normalizedIdentifier);

    if (!user) {
      throw new NotFoundException(`User with login ${identifier} not found`);
    }
    return user;
  }

  create(userData: Omit<User, 'user_id' | 'created_at'>): User {
    const normalizedEmail = (userData.email || '').trim().toLowerCase();
    const existingEmail = this.usersRepository.findByEmail(normalizedEmail);
    if (existingEmail) {
      throw new ConflictException(
        `User with email ${userData.email} already exists`,
      );
    }

    const existingPhone = this.usersRepository.findByPhone(userData.phone);
    if (existingPhone) {
      throw new ConflictException(
        `User with phone number ${userData.phone} already exists`,
      );
    }

    if (userData.employee_id) {
      const targetEmpId = (userData.employee_id || '').trim().toLowerCase();
      const existingEmployeeId = this.usersRepository
        .find()
        .find((user) => (user.employee_id || '').trim().toLowerCase() === targetEmpId);
      if (existingEmployeeId) {
        throw new ConflictException(
          `User with employee ID ${userData.employee_id} already exists`,
        );
      }
    }

    return this.usersRepository.create({
      ...userData,
      email: normalizedEmail,
    });
  }

  update(id: number, updateData: Partial<User>): User {
    this.findOne(id);

    if (updateData.email) {
      const normalizedEmail = updateData.email.trim().toLowerCase();
      const existingUser = this.usersRepository.findByEmail(normalizedEmail);
      if (existingUser && existingUser.user_id !== id) {
        throw new ConflictException(`Email ${updateData.email} is already in use`);
      }
      updateData.email = normalizedEmail;
    }

    if (updateData.phone) {
      const existingPhone = this.usersRepository.findByPhone(updateData.phone);
      if (existingPhone && existingPhone.user_id !== id) {
        throw new ConflictException(
          `Phone number ${updateData.phone} is already in use`,
        );
      }
    }

    if (updateData.employee_id) {
      const targetEmpId = (updateData.employee_id || '').trim().toLowerCase();
      const existingEmployeeId = this.usersRepository
        .find()
        .find((user) => (user.employee_id || '').trim().toLowerCase() === targetEmpId);
      if (existingEmployeeId && existingEmployeeId.user_id !== id) {
        throw new ConflictException(
          `Employee ID ${updateData.employee_id} is already in use`,
        );
      }
    }

    const updatedUser = this.usersRepository.update(id, updateData);
    if (!updatedUser) {
      throw new NotFoundException(`User with ID ${id} not found during update`);
    }

    return updatedUser;
  }

  findDepartmentOfficer(municipalityId: string): User | null {
    if (!municipalityId) return null;
    const targetMuni = municipalityId.toLowerCase().trim();
    const matches = this.usersRepository
      .find()
      .filter(
        (u) =>
          u.role === Role.DEPARTMENT_OFFICER &&
          (u.municipality_id || '').toLowerCase().trim() === targetMuni &&
          (u.status || 'Active').toLowerCase() !== 'inactive',
      );
    if (!matches.length) return null;
    return matches[matches.length - 1];
  }

  createOrReplaceDepartmentOfficer(
    userData: Omit<User, 'user_id' | 'created_at'>,
    replace = false,
  ): { officer: User; replacedPrevious: boolean } {
    const muniId = userData.municipality_id;
    if (!muniId) {
      throw new ConflictException(
        'Municipality ID is required for Department Officer',
      );
    }

    const currentOfficer = this.findDepartmentOfficer(muniId);
    if (currentOfficer && !replace) {
      throw new ConflictException(
        'An active Department Officer already exists for this municipality. Use replace to update.',
      );
    }

    let replacedPrevious = false;
    if (currentOfficer && replace) {
      this.update(currentOfficer.user_id, { status: 'Inactive' });
      replacedPrevious = true;
    }

    const officer = this.create({
      ...userData,
      status: 'Active',
      department: userData.department || 'Trade License Department',
      role: Role.DEPARTMENT_OFFICER,
    });

    return { officer, replacedPrevious };
  }

  generateNextEmployeeId(role: Role, municipalityId: string): string {
    const rolePrefix = role === Role.DEPARTMENT_OFFICER ? 'DO' : 'FO';
    const targetMuni = (municipalityId || '').trim().toLowerCase();
    const muniCode =
      (municipalityId || '')
        .trim()
        .replace(/^muni-?/i, '')
        .toUpperCase() || 'MUNI';

    const expectedPrefix = `${rolePrefix}-${muniCode}-`;
    const prefixRegex = new RegExp(`^${rolePrefix}-${muniCode}-(\\d+)$`, 'i');

    // 1. Find only users belonging strictly to this municipality and role
    const matchingUsers = this.usersRepository.find().filter((u) => {
      const uMuni = (u.municipality_id || '').trim().toLowerCase();
      const uRole = u.role;
      return uMuni === targetMuni && uRole === role;
    });

    // 2. Find maximum historical sequence for this municipality's prefix
    let maxSeq = 0;
    matchingUsers.forEach((u) => {
      const empId = String(u.employee_id || '').trim();
      const match = empId.match(prefixRegex);
      if (match) {
        const val = parseInt(match[1], 10);
        if (!isNaN(val) && val > maxSeq) {
          maxSeq = val;
        }
      }
    });

    // 3. Increment by 1
    let nextNum = maxSeq + 1;
    let candidate = `${expectedPrefix}${String(nextNum).padStart(3, '0')}`;

    // 4. Ensure global uniqueness across the store
    while (this.usersRepository.findByEmployeeId(candidate)) {
      nextNum++;
      candidate = `${expectedPrefix}${String(nextNum).padStart(3, '0')}`;
    }

    return candidate;
  }

  remove(id: number): void {
    this.findOne(id);
    this.usersRepository.delete(id);
  }
}
