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
import { OfficersModule } from './officers/officers.module';
import { AuditLogsModule } from './audit-logs/audit-logs.module';
import { AuthModule } from './auth/auth.module';
import { PersistenceModule } from './common/persistence/persistence.module';
import { PlatformAdminModule } from './platform-admin/platform-admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PersistenceModule,
    PlatformAdminModule,
    AuthModule,
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
    OfficersModule,
    AuditLogsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
