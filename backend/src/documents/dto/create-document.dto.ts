import { IsEnum, IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { DocumentType } from '../../common/enums/document-type.enum';

export class CreateDocumentDto {
  @IsNumber()
  @IsNotEmpty()
  application_id!: number;

  @IsEnum(DocumentType)
  @IsNotEmpty()
  document_type!: DocumentType;

  @IsString()
  @IsNotEmpty()
  file_path!: string;
}
