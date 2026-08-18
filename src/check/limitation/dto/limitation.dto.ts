import { VinSubjectDto } from '@/check/types';
import { Type } from 'class-transformer';
import { IsDefined, ValidateNested } from 'class-validator';

export class LimitationDto {
  @IsDefined()
  @ValidateNested()
  @Type(() => VinSubjectDto)
  subjectBody: VinSubjectDto;
}
