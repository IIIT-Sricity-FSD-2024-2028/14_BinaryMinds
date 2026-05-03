import { Module } from '@nestjs/common';
import { ComplianceRepository } from './compliance.repository';
import { ComplianceService } from './compliance.service';
import { ComplianceController } from './compliance.controller';
import { LicensesModule } from '../licenses/licenses.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [LicensesModule, UsersModule],
  controllers: [ComplianceController],
  providers: [ComplianceRepository, ComplianceService],
  exports: [ComplianceRepository, ComplianceService],
})
export class ComplianceModule {}
