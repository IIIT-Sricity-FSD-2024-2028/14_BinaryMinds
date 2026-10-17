import { Injectable } from '@nestjs/common';
import { User } from './user.interface';
import { Role } from '../common/enums/role.enum';
import { JsonStore } from '../common/persistence/json-store';

@Injectable()
export class UsersRepository {
  constructor(private readonly store: JsonStore) {
    const data = this.store.snapshot();
    let changed = this.assignMissingEmployeeIds(data.users);
    const hasAdmin = data.users.some(
      (user) =>
        user.email.trim().toLowerCase() === 'superadmin@tradezo.gov.in' ||
        user.role === Role.PLATFORM_ADMIN,
    );
    if (!hasAdmin) {
      data.users.push({
        user_id: 0,
        full_name: 'TradeZo Platform Admin',
        email: 'superadmin@tradezo.gov.in',
        phone: '9999999999',
        password_hash: 'admin123',
        role: Role.PLATFORM_ADMIN,
        created_at: new Date('2026-01-01T00:00:00.000Z'),
      });
      changed = true;
    }
    if (changed) {
      this.store.save();
    }
  }

  private assignMissingEmployeeIds(users: User[]): boolean {
    const rolePrefix = (role: Role) =>
      role === Role.FIELD_OFFICER ? 'FO' : 'DO';
    const scopes = new Map<string, { prefix: string; nextSequence: number }>();
    const usedIds = new Set(
      users.map((user) => (user.employee_id || '').trim().toLowerCase()).filter(Boolean),
    );

    for (const user of users) {
      if (user.role !== Role.FIELD_OFFICER && user.role !== Role.DEPARTMENT_OFFICER) continue;
      const municipalityId = (user.municipality_id || '').trim();
      const municipalityCode = municipalityId.replace(/^muni-?/i, '').toUpperCase() || 'MUNI';
      const prefix = `${rolePrefix(user.role)}-${municipalityCode}-`;
      const scopeKey = `${user.role}:${municipalityId.toLowerCase()}`;
      if (scopes.has(scopeKey)) continue;

      const sequenceNumbers = users
        .filter((candidate) =>
          candidate.role === user.role &&
          (candidate.municipality_id || '').trim().toLowerCase() === municipalityId.toLowerCase() &&
          candidate.employee_id?.toUpperCase().startsWith(prefix),
        )
        .map((candidate) => Number(candidate.employee_id!.slice(prefix.length)))
        .filter(Number.isSafeInteger);
      scopes.set(scopeKey, {
        prefix,
        nextSequence: Math.max(0, ...sequenceNumbers) + 1,
      });
    }

    let changed = false;
    for (const user of users) {
      if (
        (user.role !== Role.FIELD_OFFICER && user.role !== Role.DEPARTMENT_OFFICER) ||
        user.employee_id?.trim()
      ) continue;

      const municipalityId = (user.municipality_id || '').trim();
      const scopeKey = `${user.role}:${municipalityId.toLowerCase()}`;
      const scope = scopes.get(scopeKey)!;
      let candidate = `${scope.prefix}${String(scope.nextSequence).padStart(3, '0')}`;
      while (usedIds.has(candidate.toLowerCase())) {
        scope.nextSequence += 1;
        candidate = `${scope.prefix}${String(scope.nextSequence).padStart(3, '0')}`;
      }
      user.employee_id = candidate;
      usedIds.add(candidate.toLowerCase());
      scope.nextSequence += 1;
      changed = true;
    }

    return changed;
  }

  find(): User[] {
    return this.store.snapshot().users;
  }

  findById(id: number): User | undefined {
    return this.find().find((user) => user.user_id === id);
  }

  findByEmail(email: string): User | undefined {
    const normalizedEmail = (email || '').trim().toLowerCase();
    if (!normalizedEmail) return undefined;
    return this.find().find((user) => {
      const uEmail = (user.email || '').trim().toLowerCase();
      if (uEmail === normalizedEmail) return true;
      if (
        (normalizedEmail.endsWith('@tradezo.gov.in') || normalizedEmail.endsWith('@tradzo.gov.in')) &&
        (uEmail.endsWith('@tradezo.gov.in') || uEmail.endsWith('@tradzo.gov.in'))
      ) {
        return uEmail.split('@')[0] === normalizedEmail.split('@')[0];
      }
      return false;
    });
  }

  findByPhone(phone: string): User | undefined {
    const raw = (phone || '').trim();
    if (!raw) return undefined;
    const digits = raw.replace(/\D/g, '');
    return this.find().find((user) => {
      const uRaw = (user.phone || '').trim();
      const uDigits = uRaw.replace(/\D/g, '');
      return (digits && uDigits === digits) || uRaw === raw;
    });
  }

  findByEmployeeId(employeeId: string): User | undefined {
    const normalized = (employeeId || '').trim().toLowerCase();
    if (!normalized) return undefined;
    return this.find().find(
      (user) => (user.employee_id || '').trim().toLowerCase() === normalized,
    );
  }

  create(user: Omit<User, 'user_id' | 'created_at'>): User {
    const newUser: User = {
      ...user,
      full_name: (user.full_name || '').trim(),
      email: (user.email || '').trim().toLowerCase(),
      phone: (user.phone || '').trim(),
      user_id: this.store.snapshot().counters.users++,
      created_at: new Date(),
    };
    this.find().push(newUser);
    this.store.save();
    return newUser;
  }

  update(id: number, updateData: Partial<User>): User | undefined {
    const users = this.find();
    const userIndex = users.findIndex((user) => user.user_id === id);
    if (userIndex === -1) return undefined;

    users[userIndex] = { ...users[userIndex], ...updateData };
    this.store.save();
    return users[userIndex];
  }

  delete(id: number): boolean {
    const users = this.find();
    const initialLength = users.length;
    const remaining = users.filter((user) => user.user_id !== id);
    if (remaining.length === initialLength) return false;
    users.splice(0, users.length, ...remaining);
    this.store.save();
    return true;
  }
}
