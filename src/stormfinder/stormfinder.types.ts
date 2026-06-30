export type StormfinderCheckStatus = 'queued' | 'running' | 'done' | 'failed';

export type StormfinderCheckResponse = {
  id: string;
  status: StormfinderCheckStatus;
  module?: string;
  result?: Record<string, unknown>;
  error?: Record<string, unknown> | string;
};

export type StormfinderCreateCheckResponse = StormfinderCheckResponse;

export type StormfinderErrorBody = {
  detail?: string | Record<string, unknown>;
};
