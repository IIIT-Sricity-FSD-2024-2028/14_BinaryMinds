import { Type } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsNumber } from 'class-validator';
import { DocumentType } from '../../common/enums/document-type.enum';

export class CreateDocumentDto {
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  application_id!: number;

  @IsEnum(DocumentType)
  @IsNotEmpty()
  document_type!: DocumentType;
}
