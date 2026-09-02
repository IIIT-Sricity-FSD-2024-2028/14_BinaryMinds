import { Injectable } from '@nestjs/common';
import { User } from './user.interface';
import { Role } from '../common/enums/role.enum';
import { JsonStore } from '../common/persistence/json-store';

@Injectable()
export class UsersRepository {
  constructor(private readonly store: JsonStore) {
    const data = this.store.snapshot();
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
      this.store.save();
    }
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
