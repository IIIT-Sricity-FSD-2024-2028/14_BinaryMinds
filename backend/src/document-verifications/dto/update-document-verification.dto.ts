import { PartialType } from '@nestjs/swagger';
import { CreateDocumentVerificationDto } from './create-document-verification.dto';

export class UpdateDocumentVerificationDto extends PartialType(
  CreateDocumentVerificationDto,
) {}
