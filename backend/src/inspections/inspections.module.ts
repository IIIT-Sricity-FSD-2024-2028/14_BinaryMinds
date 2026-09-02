import { Module, forwardRef } from '@nestjs/common';
import { InspectionsRepository } from './inspections.repository';
import { InspectionsService } from './inspections.service';
import { InspectionsController } from './inspections.controller';
import { FieldOfficerAssignmentsModule } from '../field-officer-assignments/field-officer-assignments.module';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { ApplicationsModule } from '../applications/applications.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    FieldOfficerAssignmentsModule,
    AuditLogsModule,
    forwardRef(() => ApplicationsModule),
    forwardRef(() => UsersModule),
  ],
  controllers: [InspectionsController],
  providers: [InspectionsRepository, InspectionsService],
  exports: [InspectionsRepository, InspectionsService],
})
export class InspectionsModule {}
