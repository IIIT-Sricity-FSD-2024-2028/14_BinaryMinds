import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  BadRequestException,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Role } from '../common/enums/role.enum';
import { ApiTags } from '@nestjs/swagger';
import { ApiRoute } from '../common/swagger/api-route.decorator';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { Public } from '../common/decorators/public.decorator';
import { RegisterApplicantDto } from './dto/register-applicant.dto';

@ApiTags('Users')
@Controller('users')
@UseGuards(RolesGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  @Post('register')
  @Public()
  register(@Body() registration: RegisterApplicantDto) {
    const user = this.usersService.create({
      full_name: registration.full_name,
      email: registration.email,
      phone: registration.phone,
      password_hash: registration.password,
      role: Role.APPLICANT,
    });
    this.auditLogsService.log({
      user_name: user.full_name,
      role: Role.APPLICANT,
      action: 'Create',
      module: 'Users',
      description: `Registered applicant ${user.email}`,
      ip_address: 'server',
      source: 'backend',
    });
    return user;
  }

  @Post()
  @Roles(Role.SUPER_USER)
  @ApiRoute({
    summary: 'Create user',
    description: 'Registers or creates a user record.',
    bodyType: CreateUserDto,
    status: 201,
    responseDescription: 'Created user.',
    responseExample: { user_id: 1, full_name: 'Applicant Name', email: 'user@example.com', role: 'applicant' },
    notFound: false,
  })
  create(@Body() createUserDto: CreateUserDto) {
    if (createUserDto.role === Role.SUPER_USER || createUserDto.role === Role.APPLICANT) {
      throw new BadRequestException('Only Field Officer and Department Officer accounts can be provisioned');
    }
    const user = this.usersService.create(createUserDto);
    this.auditLogsService.log({
      user_name: user.full_name,
      role: String(user.role),
      action: 'Create',
      module: 'Users',
      description: `Created user ${user.email}`,
      ip_address: '127.0.0.1',
      source: 'backend',
    });
    return user;
  }

  @Get()
  @Roles(Role.DEPARTMENT_OFFICER) // Example restrict access to complete list
  @ApiRoute({
    summary: 'List all users',
    roles: [Role.DEPARTMENT_OFFICER],
    responseExample: [{ user_id: 1, full_name: 'Applicant Name', role: 'applicant' }],
  })
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @Roles(Role.DEPARTMENT_OFFICER, Role.FIELD_OFFICER, Role.APPLICANT)
  @ApiRoute({
    summary: 'Get user by ID',
    roles: [Role.DEPARTMENT_OFFICER, Role.FIELD_OFFICER, Role.APPLICANT],
    params: [{ name: 'id', description: 'User ID' }],
    responseExample: { user_id: 1, full_name: 'Applicant Name', role: 'applicant' },
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  @Put(':id')
  @Roles(Role.DEPARTMENT_OFFICER, Role.APPLICANT) // Applicant and Dept Officer scenarios
  @ApiRoute({
    summary: 'Update user by ID',
    roles: [Role.DEPARTMENT_OFFICER, Role.APPLICANT],
    params: [{ name: 'id', description: 'User ID' }],
    bodyType: UpdateUserDto,
    responseExample: { user_id: 1, full_name: 'Updated Name', role: 'applicant' },
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    const user = this.usersService.update(id, updateUserDto);
    this.auditLogsService.log({
      user_name: user.full_name,
      role: String(user.role),
      action: 'Update',
      module: 'Users',
      description: `Updated user ${user.email}`,
      ip_address: '127.0.0.1',
      source: 'backend',
    });
    return user;
  }

  @Delete(':id')
  @Roles(Role.DEPARTMENT_OFFICER) // Usually only admin/officers can delete
  @ApiRoute({
    summary: 'Delete user by ID',
    roles: [Role.DEPARTMENT_OFFICER],
    params: [{ name: 'id', description: 'User ID' }],
    responseExample: true,
  })
  remove(@Param('id', ParseIntPipe) id: number) {
    const existing = this.usersService.findOne(id);
    const removed = this.usersService.remove(id);
    this.auditLogsService.log({
      user_name: existing.full_name,
      role: String(existing.role),
      action: 'Delete',
      module: 'Users',
      description: `Deleted user ${existing.email}`,
      ip_address: '127.0.0.1',
      source: 'backend',
    });
    return removed;
  }
}
