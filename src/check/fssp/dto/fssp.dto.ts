import {
  IsIn,
  IsObject,
  Validate,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

export type FsspCheckType =
  | 'for_fio_dob'
  | 'for_inn'
  | 'for_ip'
  | 'for_doc_id';

@ValidatorConstraint({ name: 'fsspSubjectBody', async: false })
class FsspSubjectBodyValidator implements ValidatorConstraintInterface {
  public validate(_value: unknown, args: ValidationArguments): boolean {
    const { type, subjectBody } = args.object as FsspCheckDto;

    if (!subjectBody || typeof subjectBody !== 'object') return false;

    switch (type) {
      case 'for_fio_dob':
        return nonEmptyString(subjectBody.fio) && nonEmptyString(subjectBody.dob);
      case 'for_inn':
        return isInn(subjectBody.inn);
      case 'for_ip':
        return nonEmptyString(subjectBody.ip);
      case 'for_doc_id':
        return nonEmptyString(subjectBody.doc_id);
    }
  }

  public defaultMessage(): string {
    return 'subjectBody не соответствует выбранному type';
  }
}

function nonEmptyString(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

function isInn(value: unknown): boolean {
  return typeof value === 'string' && /^(?:\d{10}|\d{12})$/.test(value);
}

export class FsspCheckDto {
  @IsIn(['for_fio_dob', 'for_inn', 'for_ip', 'for_doc_id'])
  type: FsspCheckType;

  @IsObject()
  @Validate(FsspSubjectBodyValidator)
  subjectBody: Record<string, string>;
}
