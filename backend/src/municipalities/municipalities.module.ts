import { Module } from '@nestjs/common';
import { MunicipalitiesController } from './municipalities.controller';
import { MunicipalitiesService } from './municipalities.service';
import { MunicipalitiesRepository } from './municipalities.repository';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  controllers: [MunicipalitiesController],
  providers: [MunicipalitiesService, MunicipalitiesRepository],
  exports: [MunicipalitiesService, MunicipalitiesRepository],
})
export class MunicipalitiesModule {}
