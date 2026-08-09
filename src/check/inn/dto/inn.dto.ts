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

@ValidatorConstraint({ name: 'innSubjectBody', async: false })
class InnSubjectBodyValidator implements ValidatorConstraintInterface {
  public validate(
    subjectBody: InnSubjectDto,
    args: ValidationArguments,
  ): boolean {
    const dto = args.object as InnDto;

    if (dto.type === 'for_text') return Boolean(subjectBody?.text?.trim());
    if (dto.type === 'for_structured') {
      return Boolean(
        subjectBody?.fio?.trim() &&
          subjectBody?.dob?.trim() &&
          subjectBody?.passport?.trim(),
      );
    }

    return false;
  }

  public defaultMessage(): string {
    return 'subjectBody не соответствует выбранному type';
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
  @IsIn(['for_structured', 'for_text'])
  type: 'for_structured' | 'for_text';

  @ValidateNested()
  @Validate(InnSubjectBodyValidator)
  @Type(() => InnSubjectDto)
  subjectBody: InnSubjectDto;
}
