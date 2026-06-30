import {
  IsIn,
  IsObject,
  Validate,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

export type FsspCheckMode = 'fio_dob' | 'inn' | 'ip' | 'doc_id';

@ValidatorConstraint({ name: 'fsspSubject', async: false })
class FsspSubjectValidator implements ValidatorConstraintInterface {
  public validate(_subject: unknown, args: ValidationArguments): boolean {
    const dto = args.object as FsspCheckDto;
    const { mode, subject } = dto;

    if (!subject || typeof subject !== 'object') {
      return false;
    }

    switch (mode) {
      case 'fio_dob':
        return Boolean(subject.fio?.trim() && subject.dob?.trim());
      case 'inn':
        return /^\d{10}$|^\d{12}$/.test(subject.inn ?? '');
      case 'ip':
        return Boolean(subject.ip?.trim());
      case 'doc_id':
        return Boolean(subject.doc_id?.trim());
      default:
        return false;
    }
  }

  public defaultMessage(): string {
    return 'subject не соответствует выбранному mode';
  }
}

export class FsspCheckDto {
  @IsIn(['fio_dob', 'inn', 'ip', 'doc_id'])
  mode: FsspCheckMode;

  @IsObject()
  @Validate(FsspSubjectValidator)
  subject: Record<string, string>;
}
