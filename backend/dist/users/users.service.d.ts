import { UsersRepository } from './users.repository';
import { User } from './user.interface';
export declare class UsersService {
    private readonly usersRepository;
    constructor(usersRepository: UsersRepository);
    findAll(): User[];
    findOne(id: number): User;
    findByEmail(email: string): User;
    create(userData: Omit<User, 'user_id' | 'created_at'>): User;
    update(id: number, updateData: Partial<User>): User;
    remove(id: number): void;
}
