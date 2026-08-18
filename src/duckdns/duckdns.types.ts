export type DuckdnsCheckStatus = 'processing' | 'completed' | 'error';

export type DuckdnsRestriction = {
  model?: string;
  year?: string;
  restriction_date?: string;
  region?: string;
  author_name?: string;
  author_phone?: string;
  restriction_type?: string;
  description?: string;
  gibdd_id?: string;
};

export type DuckdnsCheck = {
  check_type?: string;
  check_id?: string;
  status?: string;
  result?: {
    description?: string;
    details?: DuckdnsRestriction[];
  };
  error?: unknown;
};

export type DuckdnsVehicleCheckResponse = {
  request_id: string;
  vehicle_eid?: string;
  status: DuckdnsCheckStatus;
  checks?: DuckdnsCheck[];
  accepted_checks?: DuckdnsCheck[];
  error?: unknown;
};

export type DuckdnsErrorBody = {
  detail?: unknown;
  message?: unknown;
};
