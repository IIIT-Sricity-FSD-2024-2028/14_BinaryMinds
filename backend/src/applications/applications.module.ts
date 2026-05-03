import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { ApplicationsService } from './applications.service';
import { ApplicationsRepository } from './applications.repository';
import { ApplicationsController } from './applications.controller';

@Module({
  imports: [UsersModule],
  controllers: [ApplicationsController],
  providers: [ApplicationsService, ApplicationsRepository],
  exports: [ApplicationsService],
})
export class ApplicationsModule {}
