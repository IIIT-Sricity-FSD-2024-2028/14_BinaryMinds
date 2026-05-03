import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { DocumentVerificationStatus } from '../../common/enums/document-verification-status.enum';

export class CreateDocumentVerificationDto {
  @IsNumber()
  @IsNotEmpty()
  application_id!: number;

  @IsNumber()
  @IsNotEmpty()
  field_officer_id!: number;

  @IsEnum(DocumentVerificationStatus)
  @IsOptional()
  verification_status?: DocumentVerificationStatus;

  @IsString()
  @IsOptional()
  rejection_reason?: string;
}
