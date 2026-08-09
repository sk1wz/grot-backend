import { VinSubjectDto } from '@/check/types';
import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';

export class GibddDto {
  @ValidateNested()
  @Type(() => VinSubjectDto)
  subjectBody: VinSubjectDto;
}
