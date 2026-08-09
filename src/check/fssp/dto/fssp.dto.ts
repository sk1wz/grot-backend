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
        return Boolean(subjectBody.fio?.trim() && subjectBody.dob?.trim());
      case 'for_inn':
        return /^\d{10}$|^\d{12}$/.test(subjectBody.inn ?? '');
      case 'for_ip':
        return Boolean(subjectBody.ip?.trim());
      case 'for_doc_id':
        return Boolean(subjectBody.doc_id?.trim());
    }
  }

  public defaultMessage(): string {
    return 'subjectBody не соответствует выбранному type';
  }
}

export class FsspCheckDto {
  @IsIn(['for_fio_dob', 'for_inn', 'for_ip', 'for_doc_id'])
  type: FsspCheckType;

  @IsObject()
  @Validate(FsspSubjectBodyValidator)
  subjectBody: Record<string, string>;
}
