import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
export declare class UsersController {
    private readonly usersService;
    private readonly auditLogsService;
    constructor(usersService: UsersService, auditLogsService: AuditLogsService);
    create(createUserDto: CreateUserDto): import("./user.interface").User;
    findAll(): import("./user.interface").User[];
    findOne(id: number): import("./user.interface").User;
    update(id: number, updateUserDto: UpdateUserDto): import("./user.interface").User;
    remove(id: number): void;
}
