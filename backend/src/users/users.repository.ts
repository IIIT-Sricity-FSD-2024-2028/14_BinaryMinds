import { Injectable } from '@nestjs/common';
import { User } from './user.interface';
import { Role } from '../common/enums/role.enum';

@Injectable()
export class UsersRepository {
  // In-memory data storage for users
  private users: User[] = [
    {
      user_id: 1,
      full_name: 'Rajesh Kumar',
      email: 'rajesh@example.com',
      phone: '9876543210',
      password_hash: 'demo',
      role: Role.APPLICANT,
      created_at: new Date('2026-02-20T10:00:00Z'),
    },
    {
      user_id: 2,
      full_name: 'Vikram Singh',
      email: 'vikram@example.com',
      phone: '9876543211',
      password_hash: 'demo',
      role: Role.APPLICANT,
      created_at: new Date('2026-02-18T14:30:00Z'),
    },
    {
      user_id: 3,
      full_name: 'Priya Sharma',
      email: 'priya@example.com',
      phone: '9876543213',
      password_hash: 'demo',
      role: Role.APPLICANT,
      created_at: new Date('2026-02-12T09:15:00Z'),
    },
    {
      user_id: 4,
      full_name: 'Department Officer',
      email: 'do@tradezo.gov.in',
      phone: '9000000000',
      employee_id: 'DO-1001',
      password_hash: 'demo',
      role: Role.DEPARTMENT_OFFICER,
      created_at: new Date('2026-01-01T00:00:00Z'),
    },
  ];
  private idCounter = 5;

  find(): User[] {
    return this.users;
  }

  findById(id: number): User | undefined {
    return this.users.find((user) => user.user_id === id);
  }

  findByEmail(email: string): User | undefined {
    return this.users.find((user) => user.email === email);
  }

  create(user: Omit<User, 'user_id' | 'created_at'>): User {
    const newUser: User = {
      ...user,
      user_id: this.idCounter++,
      created_at: new Date(),
    };
    this.users.push(newUser);
    return newUser;
  }

  update(id: number, updateData: Partial<User>): User | undefined {
    const userIndex = this.users.findIndex((user) => user.user_id === id);
    if (userIndex === -1) return undefined;

    this.users[userIndex] = { ...this.users[userIndex], ...updateData };
    return this.users[userIndex];
  }

  delete(id: number): boolean {
    const initialLength = this.users.length;
    this.users = this.users.filter((user) => user.user_id !== id);
    return this.users.length !== initialLength;
  }
}
