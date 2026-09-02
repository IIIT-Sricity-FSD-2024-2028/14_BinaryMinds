import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Role } from '../common/enums/role.enum';
import { PlatformAdminService } from './platform-admin.service';
import { UpdateRevenueSettingsDto } from './dto/update-revenue-settings.dto';

@Controller('platform-admin')
@UseGuards(RolesGuard)
@Roles(Role.PLATFORM_ADMIN)
export class PlatformAdminController {
  constructor(private readonly service: PlatformAdminService) {}
  @Get('overview') overview() { return this.service.overview(); }
  @Get('corporations') corporations() { return this.service.corporations(); }
  @Get('revenue') revenue() { return this.service.revenue(); }
  @Get('transactions') transactions() { return this.service.revenue().records; }
  @Get('settings') settings() { return this.service.settings(); }
  @Patch('settings')
  updateSettings(@Body() settings: UpdateRevenueSettingsDto) {
    return this.service.updateSettings(settings);
  }
}
