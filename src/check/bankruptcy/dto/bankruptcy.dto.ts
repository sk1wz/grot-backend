import { Type } from 'class-transformer';
import {
  IsIn,
  IsOptional,
  IsString,
  Validate,
  ValidateNested,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'bankruptcySubjectBody', async: false })
class BankruptcySubjectBodyValidator implements ValidatorConstraintInterface {
  public validate(
    subjectBody: BankruptcySubjectDto,
    args: ValidationArguments,
  ): boolean {
    const dto = args.object as BankruptcyDto;

    if (dto.type === 'for_inn') return nonEmptyString(subjectBody?.inn);
    if (dto.type === 'for_fio') return nonEmptyString(subjectBody?.fio);
    return false;
  }

  public defaultMessage(): string {
    return 'subjectBody не соответствует выбранному type';
  }
}

function nonEmptyString(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

export class BankruptcySubjectDto {
  @IsOptional()
  @IsString()
  inn?: string;

  @IsOptional()
  @IsString()
  fio?: string;
}

export class BankruptcyDto {
  @IsIn(['for_inn', 'for_fio'])
  type: 'for_inn' | 'for_fio';

  @ValidateNested()
  @Validate(BankruptcySubjectBodyValidator)
  @Type(() => BankruptcySubjectDto)
  subjectBody: BankruptcySubjectDto;
}
