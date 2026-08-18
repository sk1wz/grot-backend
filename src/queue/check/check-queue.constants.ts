import { CheckModuleEnums } from '@/db';

export const CHECK_SINGLE_QUEUE = 'checks-single';

export const CHECK_QUEUE_MODULES = [
  CheckModuleEnums.GIBDD,
  CheckModuleEnums.LIMITATION,
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
