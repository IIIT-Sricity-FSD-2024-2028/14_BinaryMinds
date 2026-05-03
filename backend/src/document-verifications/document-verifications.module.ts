import { Module } from '@nestjs/common';
import { DocumentVerificationsRepository } from './document-verifications.repository';
import { DocumentVerificationsService } from './document-verifications.service';

@Module({
  providers: [DocumentVerificationsRepository, DocumentVerificationsService],
  exports: [DocumentVerificationsService],
})
export class DocumentVerificationsModule {}
