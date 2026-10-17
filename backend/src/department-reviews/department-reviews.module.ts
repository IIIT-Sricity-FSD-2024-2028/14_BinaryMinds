import { Module } from '@nestjs/common';
import { DepartmentReviewsRepository } from './department-reviews.repository';
import { DepartmentReviewsService } from './department-reviews.service';
import { DepartmentReviewsController } from './department-reviews.controller';
import { ApplicationsModule } from '../applications/applications.module';
import { UsersModule } from '../users/users.module';
import { InspectionsModule } from '../inspections/inspections.module';

@Module({
  imports: [ApplicationsModule, UsersModule, InspectionsModule],
  controllers: [DepartmentReviewsController],
  providers: [DepartmentReviewsRepository, DepartmentReviewsService],
  exports: [DepartmentReviewsRepository, DepartmentReviewsService],
})
export class DepartmentReviewsModule {}
