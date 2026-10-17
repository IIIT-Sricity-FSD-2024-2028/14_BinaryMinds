import { forwardRef, Module } from '@nestjs/common';
import { FieldOfficerAssignmentsRepository } from './field-officer-assignments.repository';
import { FieldOfficerAssignmentsService } from './field-officer-assignments.service';
import { FieldOfficerAssignmentsController } from './field-officer-assignments.controller';
import { ApplicationsModule } from '../applications/applications.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [forwardRef(() => ApplicationsModule), UsersModule],
  controllers: [FieldOfficerAssignmentsController],
  providers: [FieldOfficerAssignmentsRepository, FieldOfficerAssignmentsService],
  exports: [FieldOfficerAssignmentsRepository, FieldOfficerAssignmentsService],
})
export class FieldOfficerAssignmentsModule {}
