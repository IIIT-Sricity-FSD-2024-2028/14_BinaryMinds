import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Query,
  Delete,
  BadRequestException,
  ForbiddenException,
  ParseIntPipe,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
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
import { AuthenticatedUser } from '../auth/auth-session.interface';

@ApiTags('Users')
@Controller('users')
@UseGuards(RolesGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  @Public()
  @Post('register')
  @ApiRoute({
    summary: 'Register applicant user',
    description: 'Registers a new citizen/applicant user with self-supplied credentials.',
    bodyType: RegisterApplicantDto,
    status: 201,
    responseDescription: 'Registered applicant.',
    responseExample: { user_id: 1, full_name: 'Applicant Name', email: 'applicant@example.com', role: 'applicant' },
  })
  register(@Body() registerDto: RegisterApplicantDto) {
    const user = this.usersService.create({
      full_name: registerDto.full_name.trim(),
      email: registerDto.email.trim().toLowerCase(),
      phone: registerDto.phone.trim(),
      password_hash: registerDto.password.trim(),
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
  @Roles(Role.SUPER_USER, Role.PLATFORM_ADMIN)
  @ApiRoute({
    summary: 'Create user',
    description: 'Registers or creates a user record.',
    bodyType: CreateUserDto,
    status: 201,
    responseDescription: 'Created user.',
    responseExample: { user_id: 1, full_name: 'Applicant Name', email: 'user@example.com', role: 'applicant' },
    notFound: false,
  })
  create(
    @Body() createUserDto: CreateUserDto,
    @Req() request: Request & { user: AuthenticatedUser },
  ) {
    if (request.user.role === Role.SUPER_USER && (createUserDto.role === Role.SUPER_USER || createUserDto.role === Role.APPLICANT)) {
      throw new BadRequestException('Only Field Officer and Department Officer accounts can be provisioned by Municipal Head');
    }

    const password = (createUserDto.password_hash || createUserDto.password || '').trim();
    if (!password || password.length < 6) {
      throw new BadRequestException('Password must be at least 6 characters long');
    }

    let assignedMuniId: string;
    if (request.user.role === Role.PLATFORM_ADMIN) {
      if (!createUserDto.municipality_id) {
        throw new BadRequestException('municipality_id is required when creating a user as Platform Admin');
      }
      assignedMuniId = createUserDto.municipality_id;
    } else {
      // Municipal Head (SUPER_USER / MUNICIPAL_COMMISSIONER)
      if (!request.user.municipalityId) {
        throw new ForbiddenException('Municipal Head has no assigned municipality');
      }
      if (
        createUserDto.municipality_id &&
        createUserDto.municipality_id.toLowerCase() !== request.user.municipalityId.toLowerCase()
      ) {
        throw new ForbiddenException(
          'Municipal Head cannot create officers for a different municipality',
        );
      }
      assignedMuniId = request.user.municipalityId;
    }

    const targetRole = createUserDto.role || Role.FIELD_OFFICER;

    // Backend-controlled Employee ID generation:
    // The frontend must NEVER be trusted to supply the Employee ID.
    // The backend automatically generates a sequential 3-digit zero-padded ID
    // scoped strictly to the authenticated SUPER_USER's municipality (e.g. FO-BLR-001, FO-HYD-001).
    let employeeId: string | undefined;
    if (targetRole === Role.FIELD_OFFICER || targetRole === Role.DEPARTMENT_OFFICER) {
      employeeId = this.usersService.generateNextEmployeeId(targetRole, assignedMuniId);
    } else if (createUserDto.employee_id) {
      employeeId = createUserDto.employee_id.trim();
    }

    if (createUserDto.role === Role.DEPARTMENT_OFFICER) {
      const result = this.usersService.createOrReplaceDepartmentOfficer(
        {
          full_name: createUserDto.full_name.trim(),
          email: createUserDto.email.trim().toLowerCase(),
          phone: createUserDto.phone.trim(),
          employee_id: employeeId,
          password_hash: password,
          role: Role.DEPARTMENT_OFFICER,
          municipality_id: assignedMuniId,
          department: createUserDto.department || 'Trade License Department',
          status: 'Active',
        },
        createUserDto.replace,
      );

      this.auditLogsService.log({
        user_name: request.user.fullName || 'Admin User',
        role: String(result.officer.role),
        action: result.replacedPrevious ? 'Replace' : 'Create',
        module: 'Users',
        description: `${result.replacedPrevious ? 'Replaced' : 'Created'} department officer ${result.officer.email}`,
        ip_address: '127.0.0.1',
        source: 'backend',
      });
      return result.officer;
    }

    const user = this.usersService.create({
      full_name: createUserDto.full_name.trim(),
      email: createUserDto.email.trim().toLowerCase(),
      phone: createUserDto.phone.trim(),
      employee_id: employeeId,
      password_hash: password,
      role: createUserDto.role || Role.FIELD_OFFICER,
      municipality_id: assignedMuniId,
      status: createUserDto.status || 'Active',
    });

    this.auditLogsService.log({
      user_name: request.user.fullName || 'Admin User',
      role: String(user.role),
      action: 'Create',
      module: 'Users',
      description: `Created user ${user.email}`,
      ip_address: '127.0.0.1',
      source: 'backend',
    });
    return user;
  }

  @Get('department-officer')
  @Roles(Role.DEPARTMENT_OFFICER, Role.SUPER_USER, Role.PLATFORM_ADMIN)
  @ApiRoute({
    summary: 'Get single active Department Officer for municipality',
    roles: [Role.DEPARTMENT_OFFICER, Role.SUPER_USER, Role.PLATFORM_ADMIN],
    wrappedResponse: true,
  })
  getDepartmentOfficer(
    @Req() request: Request & { user: AuthenticatedUser },
    @Query('municipality_id') queryMuniId?: string,
  ) {
    const targetMuni =
      request.user.role === Role.PLATFORM_ADMIN
        ? (queryMuniId || request.user.municipalityId || '')
        : request.user.municipalityId;
    return {
      success: true,
      data: targetMuni ? this.usersService.findDepartmentOfficer(targetMuni) : null,
    };
  }

  @Post('department-officer')
  @Roles(Role.SUPER_USER, Role.PLATFORM_ADMIN)
  @ApiRoute({
    summary: 'Add Department Officer for municipality',
    roles: [Role.SUPER_USER, Role.PLATFORM_ADMIN],
    bodyType: CreateUserDto,
    status: 201,
  })
  addDepartmentOfficer(
    @Body() dto: CreateUserDto,
    @Req() request: Request & { user: AuthenticatedUser },
  ) {
    return this.create({ ...dto, role: Role.DEPARTMENT_OFFICER }, request);
  }

  @Post('department-officer/replace')
  @Roles(Role.SUPER_USER, Role.PLATFORM_ADMIN)
  @ApiRoute({
    summary: 'Replace Department Officer for municipality',
    roles: [Role.SUPER_USER, Role.PLATFORM_ADMIN],
    bodyType: CreateUserDto,
    status: 201,
  })
  replaceDepartmentOfficer(
    @Body() dto: CreateUserDto,
    @Req() request: Request & { user: AuthenticatedUser },
  ) {
    return this.create({ ...dto, role: Role.DEPARTMENT_OFFICER, replace: true }, request);
  }

  @Put('department-officer/replace')
  @Roles(Role.SUPER_USER, Role.PLATFORM_ADMIN)
  replaceDepartmentOfficerPut(
    @Body() dto: CreateUserDto,
    @Req() request: Request & { user: AuthenticatedUser },
  ) {
    return this.create({ ...dto, role: Role.DEPARTMENT_OFFICER, replace: true }, request);
  }

  @Get()
  @Roles(Role.DEPARTMENT_OFFICER, Role.SUPER_USER, Role.PLATFORM_ADMIN)
  @ApiRoute({
    summary: 'List all users',
    roles: [Role.DEPARTMENT_OFFICER, Role.SUPER_USER, Role.PLATFORM_ADMIN],
    responseExample: [{ user_id: 1, full_name: 'Applicant Name', role: 'applicant' }],
  })
  findAll(@Req() request: Request & { user: AuthenticatedUser }) {
    if (request.user.role === Role.PLATFORM_ADMIN) {
      return this.usersService.findAll();
    }
    const userMuni = request.user.municipalityId;
    if (!userMuni) return [];
    return this.usersService
      .findAll()
      .filter((u) => (u.municipality_id || '').toLowerCase() === userMuni.toLowerCase());
  }

  @Get('profile')
  @Roles(Role.DEPARTMENT_OFFICER, Role.FIELD_OFFICER, Role.APPLICANT, Role.SUPER_USER, Role.PLATFORM_ADMIN)
  @ApiRoute({
    summary: 'Get current user profile',
    roles: [Role.DEPARTMENT_OFFICER, Role.FIELD_OFFICER, Role.APPLICANT, Role.SUPER_USER, Role.PLATFORM_ADMIN],
    responseExample: { user_id: 1, full_name: 'Applicant Name', role: 'applicant' },
  })
  getProfile(@Req() request: Request & { user: AuthenticatedUser }) {
    if (request.user.role === Role.PLATFORM_ADMIN) {
      return {
        user_id: 0,
        full_name: 'TradeZo Platform Admin',
        email: 'superadmin@tradezo.gov.in',
        role: Role.PLATFORM_ADMIN,
      };
    }
    return this.usersService.findOne(request.user.userId);
  }

  @Get('me')
  @Roles(Role.DEPARTMENT_OFFICER, Role.FIELD_OFFICER, Role.APPLICANT, Role.SUPER_USER, Role.PLATFORM_ADMIN)
  getMe(@Req() request: Request & { user: AuthenticatedUser }) {
    return this.getProfile(request);
  }

  @Get(':id')
  @Roles(Role.DEPARTMENT_OFFICER, Role.FIELD_OFFICER, Role.APPLICANT, Role.SUPER_USER, Role.PLATFORM_ADMIN)
  @ApiRoute({
    summary: 'Get user by ID',
    roles: [Role.DEPARTMENT_OFFICER, Role.FIELD_OFFICER, Role.APPLICANT, Role.SUPER_USER, Role.PLATFORM_ADMIN],
    params: [{ name: 'id', description: 'User ID' }],
    responseExample: { user_id: 1, full_name: 'Applicant Name', role: 'applicant' },
  })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: Request & { user: AuthenticatedUser },
  ) {
    const user = this.usersService.findOne(id);
    if (request.user.role === Role.PLATFORM_ADMIN || request.user.userId === id) {
      return user;
    }
    const userMuni = request.user.municipalityId;
    if (!userMuni || (user.municipality_id || '').toLowerCase() !== userMuni.toLowerCase()) {
      throw new ForbiddenException('Access denied to users outside your municipality');
    }
    return user;
  }

  @Put(':id')
  @Roles(Role.DEPARTMENT_OFFICER, Role.APPLICANT, Role.SUPER_USER, Role.PLATFORM_ADMIN)
  @ApiRoute({
    summary: 'Update user by ID',
    roles: [Role.DEPARTMENT_OFFICER, Role.APPLICANT, Role.SUPER_USER, Role.PLATFORM_ADMIN],
    params: [{ name: 'id', description: 'User ID' }],
    bodyType: UpdateUserDto,
    responseExample: { user_id: 1, full_name: 'Updated Name', role: 'applicant' },
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
    @Req() request: Request & { user: AuthenticatedUser },
  ) {
    const existing = this.usersService.findOne(id);
    if (request.user.role !== Role.PLATFORM_ADMIN && request.user.userId !== id) {
      const userMuni = request.user.municipalityId;
      if (!userMuni || (existing.municipality_id || '').toLowerCase() !== userMuni.toLowerCase()) {
        throw new ForbiddenException('Access denied to update users outside your municipality');
      }
    }

    const user = this.usersService.update(id, updateUserDto);
    this.auditLogsService.log({
      user_name: request.user.fullName || user.full_name,
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
  @Roles(Role.DEPARTMENT_OFFICER, Role.SUPER_USER, Role.PLATFORM_ADMIN)
  @ApiRoute({
    summary: 'Delete user by ID',
    roles: [Role.DEPARTMENT_OFFICER, Role.SUPER_USER, Role.PLATFORM_ADMIN],
    params: [{ name: 'id', description: 'User ID' }],
    responseExample: true,
  })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: Request & { user: AuthenticatedUser },
  ) {
    const existing = this.usersService.findOne(id);
    if (request.user.role !== Role.PLATFORM_ADMIN) {
      const userMuni = request.user.municipalityId;
      if (!userMuni || (existing.municipality_id || '').toLowerCase() !== userMuni.toLowerCase()) {
        throw new ForbiddenException('Access denied to delete users outside your municipality');
      }
    }

    this.usersService.remove(id);
    this.auditLogsService.log({
      user_name: request.user.fullName || existing.full_name,
      role: String(existing.role),
      action: 'Delete',
      module: 'Users',
      description: `Deleted user ${existing.email}`,
      ip_address: '127.0.0.1',
      source: 'backend',
    });
    return { success: true, message: `User ${id} removed` };
  }
}

