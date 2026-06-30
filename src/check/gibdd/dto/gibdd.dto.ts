import { VinSubjectDto } from '@/check/types/vin.type';
import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';

export class GibddDto {
  @ValidateNested()
  @Type(() => VinSubjectDto)
  subject: VinSubjectDto;
}
