import { Module } from '@nestjs/common';
import { DocumentsRepository } from './documents.repository';
import { DocumentsService } from './documents.service';
import { DocumentsController } from './documents.controller';
import { ApplicationsModule } from '../applications/applications.module';
import { DocumentUploadCleanupInterceptor } from './document-upload-cleanup.interceptor';

@Module({
  imports: [ApplicationsModule],
  controllers: [DocumentsController],
  providers: [DocumentsService, DocumentsRepository, DocumentUploadCleanupInterceptor],
  exports: [DocumentsService],
})
export class DocumentsModule {}
