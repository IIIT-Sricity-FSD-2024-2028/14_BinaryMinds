import { Module } from '@nestjs/common';
import { InspectionsRepository } from './inspections.repository';
import { InspectionsService } from './inspections.service';
import { InspectionsController } from './inspections.controller';
import { FieldOfficerAssignmentsModule } from '../field-officer-assignments/field-officer-assignments.module';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@Module({
  imports: [FieldOfficerAssignmentsModule, AuditLogsModule],
  controllers: [InspectionsController],
  providers: [InspectionsRepository, InspectionsService],
  exports: [InspectionsRepository, InspectionsService],
})
export class InspectionsModule {}
