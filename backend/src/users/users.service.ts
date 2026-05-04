import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { User } from './user.interface';

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

  create(userData: Omit<User, 'user_id' | 'created_at'>): User {
    // Business logic data validation for email and phone uniqueness
    const existingEmail = this.usersRepository.findByEmail(userData.email);
    if (existingEmail) {
      throw new ConflictException(
        `User with email ${userData.email} already exists`,
      );
    }

    const existingPhone = this.usersRepository
      .find()
      .find((user) => user.phone === userData.phone);
    if (existingPhone) {
      throw new ConflictException(
        `User with phone number ${userData.phone} already exists`,
      );
    }

    if (userData.employee_id) {
      const existingEmployeeId = this.usersRepository
        .find()
        .find((user) => user.employee_id === userData.employee_id);
      if (existingEmployeeId) {
        throw new ConflictException(
          `User with employee ID ${userData.employee_id} already exists`,
        );
      }
    }

    return this.usersRepository.create(userData);
  }

  update(id: number, updateData: Partial<User>): User {
    // Validate user exists
    this.findOne(id);

    // Validate email constraints if email is being updated
    if (updateData.email) {
      const existingUser = this.usersRepository.findByEmail(updateData.email);
      if (existingUser && existingUser.user_id !== id) {
        throw new ConflictException(`Email ${updateData.email} is already in use`);
      }
    }

    // Validate phone constraints if phone is being updated
    if (updateData.phone) {
      const existingPhone = this.usersRepository
        .find()
        .find((user) => user.phone === updateData.phone);
      if (existingPhone && existingPhone.user_id !== id) {
        throw new ConflictException(
          `Phone number ${updateData.phone} is already in use`,
        );
      }
    }

    if (updateData.employee_id) {
      const existingEmployeeId = this.usersRepository
        .find()
        .find((user) => user.employee_id === updateData.employee_id);
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

  remove(id: number): void {
    // Validate user exists before removal
    this.findOne(id);
    this.usersRepository.delete(id);
  }
}
