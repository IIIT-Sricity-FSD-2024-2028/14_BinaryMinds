import { PartialType } from '@nestjs/swagger';
import { CreateComplianceRecordDto } from './create-compliance-record.dto';

export class UpdateComplianceRecordDto extends PartialType(CreateComplianceRecordDto) {}
