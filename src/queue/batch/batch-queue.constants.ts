export const BATCH_GIBDD_QUEUE = 'batch-gibdd';
export const BATCH_OTHER_QUEUE = 'batch-other';
export const BATCH_RUN_JOB = 'run-batch';
/** Strict sequential execution: the next check starts only after the prior one is terminal. */
export const BATCH_CHUNK_SIZE = 2;

export type BatchJobData = { batchId: string };
