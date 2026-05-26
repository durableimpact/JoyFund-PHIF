// ── Activity Log ──

declare type LogLevel = "INFO" | "WARNING" | "ERROR" | "CRITICAL";
declare type LogSource =
  | "SERVICE"
  | "SIGNAL"
  | "CELERY_TASK"
  | "MIDDLEWARE"
  | "API"
  | "ADMIN"
  | "MANAGEMENT"
  | "WEBHOOK";
declare type LogPortal =
  | "DONOR_PORTAL"
  | "HOSPITAL_ADMIN_PORTAL"
  | "RECEPTIONIST_PORTAL"
  | "BENEFICIARY_PORTAL"
  | "SYSTEM_ADMIN_PORTAL"
  | "SOCIAL_WORKER_PORTAL";

declare interface ActivityLog {
  id: string;
  user_id?: string | null;
  actor_label: string;
  action: string;
  portal?: LogPortal | null;
  source: LogSource;
  level: LogLevel;
  target_type?: string | null;
  target_id?: string | null;
  target_label?: string | null;
  description: string;
  metadata: Record<string, any>;
  ip_address?: string | null;
  user_agent: string;
  request_id: string;
  created_at: string;
}

// ── Error Log ──

declare interface ErrorLog {
  id: string;
  request_id: string;
  user_id?: string | null;
  source: LogSource;
  error_type: string;
  error_message: string;
  stack_trace: string;
  path: string;
  extra: Record<string, any>;
  created_at: string;
}

// ── Request Log ──

declare type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS" | "TRACE";

declare interface RequestLog {
  id: string;
  request_id: string;
  user_id?: string | null;
  source: LogSource;
  method: HttpMethod;
  path: string;
  query_params: Record<string, any>;
  request_body: string;
  status_code: number;
  response_time_ms: number;
  ip_address?: string | null;
  user_agent: string;
  referrer: string;
  created_at: string;
}

// ── Log Stats ──

declare interface LogStats {
  activity_count: number;
  error_count: number;
  request_count: number;
  errors_by_type: { error_type: string; count: number }[];
  requests_by_status: { status_code: number; count: number }[];
}
