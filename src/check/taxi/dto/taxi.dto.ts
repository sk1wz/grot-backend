import { VinSubjectDto } from '@/check/types';
import { Type } from 'class-transformer';
import { IsDefined, ValidateNested } from 'class-validator';

export class TaxiDto {
  @IsDefined()
  @ValidateNested()
  @Type(() => VinSubjectDto)
  subjectBody: VinSubjectDto;
}
