import { User } from './user.interface';
import { JsonStore } from '../common/persistence/json-store';
export declare class UsersRepository {
    private readonly store;
    private readonly defaultUsers;
    constructor(store: JsonStore);
    find(): User[];
    findById(id: number): User | undefined;
    findByEmail(email: string): User | undefined;
    create(user: Omit<User, 'user_id' | 'created_at'>): User;
    update(id: number, updateData: Partial<User>): User | undefined;
    delete(id: number): boolean;
}
