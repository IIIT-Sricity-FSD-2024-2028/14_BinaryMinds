import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { RegisterApplicantDto } from './dto/register-applicant.dto';
export declare class UsersController {
    private readonly usersService;
    private readonly auditLogsService;
    constructor(usersService: UsersService, auditLogsService: AuditLogsService);
    register(registration: RegisterApplicantDto): import("./user.interface").User;
    create(createUserDto: CreateUserDto): import("./user.interface").User;
    findAll(): import("./user.interface").User[];
    findOne(id: number): import("./user.interface").User;
    update(id: number, updateUserDto: UpdateUserDto): import("./user.interface").User;
    remove(id: number): void;
}
