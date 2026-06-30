import { FsspCheckMode } from '../fssp/dto/fssp.dto';
import { VinSubjectDto } from './vin.type';

export type GibddCheckBody = {
  subject: VinSubjectDto;
};

export type GistorgiCheckBody = {
  subject: VinSubjectDto;
};

export type FsspCheckBody = {
  mode: FsspCheckMode;
  subject: Record<string, string>;
};

export type BankruptcyCheckBody = {
  subject: {
    inn?: string;
    fio?: string;
  };
};

export type InnCheckBody = {
  subject: {
    fio?: string;
    dob?: string;
    passport?: string;
    text?: string;
  };
};

export type CheckBody =
  | GibddCheckBody
  | GistorgiCheckBody
  | FsspCheckBody
  | BankruptcyCheckBody
  | InnCheckBody;

export function bodyFromDto<B extends Record<string, unknown>>(body: B): B {
  return body;
}
