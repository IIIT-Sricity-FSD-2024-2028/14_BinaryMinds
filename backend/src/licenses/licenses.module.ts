import { Module } from '@nestjs/common';
import { LicensesRepository } from './licenses.repository';
import { LicensesService } from './licenses.service';
import { LicensesController } from './licenses.controller';
import { ApplicationsModule } from '../applications/applications.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [ApplicationsModule, UsersModule],
  controllers: [LicensesController],
  providers: [LicensesRepository, LicensesService],
  exports: [LicensesRepository, LicensesService],
})
export class LicensesModule {}
