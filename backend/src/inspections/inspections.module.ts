import { Module } from '@nestjs/common';
import { InspectionsRepository } from './inspections.repository';
import { InspectionsService } from './inspections.service';
import { InspectionsController } from './inspections.controller';
import { FieldOfficerAssignmentsModule } from '../field-officer-assignments/field-officer-assignments.module';

@Module({
  imports: [FieldOfficerAssignmentsModule],
  controllers: [InspectionsController],
  providers: [InspectionsRepository, InspectionsService],
  exports: [InspectionsRepository, InspectionsService],
})
export class InspectionsModule {}
