import { PartialType } from '@nestjs/swagger';
import { CreateInspectionDto } from './create-inspection.dto';

export class UpdateInspectionDto extends PartialType(CreateInspectionDto) {}
