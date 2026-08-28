import { Module } from '@nestjs/common';
import { PaymentsRepository } from './payments.repository';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { ApplicationsModule } from '../applications/applications.module';
import { PlatformAdminModule } from '../platform-admin/platform-admin.module';

@Module({
  imports: [ApplicationsModule, PlatformAdminModule],
  controllers: [PaymentsController],
  providers: [PaymentsRepository, PaymentsService],
  exports: [PaymentsRepository, PaymentsService],
})
export class PaymentsModule {}
