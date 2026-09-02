import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { OfficersService } from './officers.service';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Role } from '../common/enums/role.enum';
import { ApiTags } from '@nestjs/swagger';
import { ApiRoute } from '../common/swagger/api-route.decorator';
import { AuthenticatedUser } from '../auth/auth-session.interface';

@ApiTags('Officers')
@Controller('officers')
@UseGuards(RolesGuard)
export class OfficersController {
  constructor(private readonly officersService: OfficersService) {}

  @Get()
  @Roles(Role.SUPER_USER, Role.PLATFORM_ADMIN)
  @ApiRoute({
    summary: 'List officers with workload counts',
    roles: [Role.SUPER_USER, Role.PLATFORM_ADMIN],
    responseDescription: 'List of officers with assignedCount and verifiedCount.',
    wrappedResponse: true,
    responseExample: [{ id: 2, assignedCount: 3, verifiedCount: 1 }],
    notFound: false,
  })
  findAll(@Req() request: Request & { user: AuthenticatedUser }) {
    const muniId =
      request.user.role === Role.PLATFORM_ADMIN
        ? undefined
        : request.user.municipalityId;
    return {
      success: true,
      data: this.officersService.findAll(muniId),
    };
  }
}

