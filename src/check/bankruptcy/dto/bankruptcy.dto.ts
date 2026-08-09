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

    if (dto.type === 'for_inn') return Boolean(subjectBody?.inn?.trim());
    if (dto.type === 'for_fio') return Boolean(subjectBody?.fio?.trim());
    return false;
  }

  public defaultMessage(): string {
    return 'subjectBody не соответствует выбранному type';
  }
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
