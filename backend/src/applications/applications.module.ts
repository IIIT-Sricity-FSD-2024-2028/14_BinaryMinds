import { Module, forwardRef } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { OfficersModule } from '../officers/officers.module';
import { ApplicationsService } from './applications.service';
import { ApplicationsRepository } from './applications.repository';
import { ApplicationsController } from './applications.controller';

@Module({
  imports: [UsersModule, forwardRef(() => OfficersModule)],
  controllers: [ApplicationsController],
  providers: [ApplicationsService, ApplicationsRepository],
  exports: [ApplicationsService, ApplicationsRepository],
})
export class ApplicationsModule {}
