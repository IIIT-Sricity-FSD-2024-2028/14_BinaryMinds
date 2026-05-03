import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { ApplicationsModule } from './applications/applications.module';
import { DocumentsModule } from './documents/documents.module';
import { DocumentVerificationsModule } from './document-verifications/document-verifications.module';
import { PaymentsModule } from './payments/payments.module';
import { FieldOfficerAssignmentsModule } from './field-officer-assignments/field-officer-assignments.module';
import { InspectionsModule } from './inspections/inspections.module';
import { DepartmentReviewsModule } from './department-reviews/department-reviews.module';
import { LicensesModule } from './licenses/licenses.module';
import { ComplianceModule } from './compliance/compliance.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    UsersModule,
    ApplicationsModule,
    DocumentsModule,
    DocumentVerificationsModule,
    PaymentsModule,
    FieldOfficerAssignmentsModule,
    InspectionsModule,
    DepartmentReviewsModule,
    LicensesModule,
    ComplianceModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
