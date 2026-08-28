import { Module } from '@nestjs/common';
import { PlatformAdminController } from './platform-admin.controller';
import { PlatformAdminService } from './platform-admin.service';

@Module({ controllers: [PlatformAdminController], providers: [PlatformAdminService], exports: [PlatformAdminService] })
export class PlatformAdminModule {}
