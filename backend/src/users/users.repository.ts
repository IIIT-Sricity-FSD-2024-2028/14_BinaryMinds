import { Injectable } from '@nestjs/common';
import { User } from './user.interface';

@Injectable()
export class UsersRepository {
  // In-memory data storage for users
  private users: User[] = [];
  private idCounter = 1;

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
