import { BadRequestException } from '@nestjs/common';
import { Check, CheckModuleEnums } from '@/db';

export type StormfinderRequest = {
  path: string;
  body: Record<string, unknown>;
};

type SubjectBody = Record<string, unknown>;

const FSSP_MODE_BY_TYPE: Record<string, string> = {
  for_fio_dob: 'fio_dob',
  for_inn: 'inn',
  for_ip: 'ip',
  for_doc_id: 'doc_id',
};

export function buildStormfinderRequest(check: Check): StormfinderRequest {
  const subjectBody = check.subjectBody as SubjectBody;

  switch (check.module) {
    case CheckModuleEnums.GIBDD:
      return {
        path: '/checks/gibdd',
        body: {
          subject: { vin: subjectBody.vin },
          with_osago: true,
        },
      };
    case CheckModuleEnums.GISTORGI:
      return {
        path: '/checks/gistorgi',
        body: { subject: { vin: subjectBody.vin } },
      };
    case CheckModuleEnums.FSSP:
      return {
        path: '/checks/fssp',
        body: {
          mode: getFsspMode(subjectBody),
          subject: withoutType(subjectBody),
        },
      };
    case CheckModuleEnums.BANKRUPTCY:
      return {
        path: '/checks/bancrupcy',
        body: { subject: withoutType(subjectBody) },
      };
    case CheckModuleEnums.INN:
      return {
        path: '/checks/inn',
        body: { subject: withoutType(subjectBody) },
      };
    default:
      throw new Error(`Модуль ${check.module} не поддерживается Stormfinder`);
  }
}

function getFsspMode(subjectBody: SubjectBody): string {
  const type = typeof subjectBody.type === 'string' ? subjectBody.type : '';
  const mode = FSSP_MODE_BY_TYPE[type];

  if (!mode) {
    throw new BadRequestException('Для ФССП указан неподдерживаемый type');
  }

  return mode;
}

function withoutType({ type: _type, ...subject }: SubjectBody): SubjectBody {
  return subject;
}
