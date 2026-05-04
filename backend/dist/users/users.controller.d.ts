import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    create(createUserDto: CreateUserDto): import("./user.interface").User;
    findAll(): import("./user.interface").User[];
    findOne(id: number): import("./user.interface").User;
    update(id: number, updateUserDto: UpdateUserDto): import("./user.interface").User;
    remove(id: number): void;
}
