import { User } from './user.interface';
export declare class UsersRepository {
    private users;
    private idCounter;
    find(): User[];
    findById(id: number): User | undefined;
    findByEmail(email: string): User | undefined;
    create(user: Omit<User, 'user_id' | 'created_at'>): User;
    update(id: number, updateData: Partial<User>): User | undefined;
    delete(id: number): boolean;
}
