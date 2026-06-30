import { Type } from 'class-transformer';
import {
  IsOptional,
  IsString,
  Validate,
  ValidateNested,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'bankruptcySubject', async: false })
class BankruptcySubjectValidator implements ValidatorConstraintInterface {
  public validate(subject: BankruptcySubjectDto): boolean {
    return Boolean(subject?.inn?.trim() || subject?.fio?.trim());
  }

  public defaultMessage(): string {
    return 'Укажите inn или fio в subject';
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
  @ValidateNested()
  @Validate(BankruptcySubjectValidator)
  @Type(() => BankruptcySubjectDto)
  subject: BankruptcySubjectDto;
}
