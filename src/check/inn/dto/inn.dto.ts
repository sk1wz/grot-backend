import { Type } from 'class-transformer';
import {
  IsOptional,
  IsString,
  Validate,
  ValidateNested,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'innSubject', async: false })
class InnSubjectValidator implements ValidatorConstraintInterface {
  public validate(subject: InnSubjectDto): boolean {
    if (subject?.text?.trim()) {
      return true;
    }

    return Boolean(
      subject?.fio?.trim() && subject?.dob?.trim() && subject?.passport?.trim(),
    );
  }

  public defaultMessage(): string {
    return 'Укажите subject.text или subject.fio + subject.dob + subject.passport';
  }
}

export class InnSubjectDto {
  @IsOptional()
  @IsString()
  fio?: string;

  @IsOptional()
  @IsString()
  dob?: string;

  @IsOptional()
  @IsString()
  passport?: string;

  @IsOptional()
  @IsString()
  text?: string;
}

export class InnDto {
  @ValidateNested()
  @Validate(InnSubjectValidator)
  @Type(() => InnSubjectDto)
  subject: InnSubjectDto;
}
