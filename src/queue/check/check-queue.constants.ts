import { CheckModuleEnums } from '@/db';

export const CHECK_QUEUES = {
  GIBDD: 'checks-gibdd',
  GISTORGI: 'checks-gistorgi',
  FSSP: 'checks-fssp',
  BANKRUPTCY: 'checks-bankruptcy',
  INN: 'checks-inn',
} as const;

export const CHECK_QUEUE_MODULES = [
  CheckModuleEnums.GIBDD,
  CheckModuleEnums.GISTORGI,
  CheckModuleEnums.FSSP,
  CheckModuleEnums.BANKRUPTCY,
  CheckModuleEnums.INN,
] as const;

export type QueuedCheckModule = (typeof CHECK_QUEUE_MODULES)[number];

export const CHECK_SUBMIT_JOB = 'submit-check';
export const CHECK_SYNC_JOB = 'sync-check';
export const CHECK_SYNC_DELAY_MS = 5_000;

export type CheckJobData = {
  checkId: string;
};
