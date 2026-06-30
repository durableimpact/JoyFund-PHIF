// ── Support Ticket Types ──

declare type TicketStatus =
  | "OPEN"
  | "IN_PROGRESS"
  | "WAITING_FOR_USER"
  | "RESOLVED"
  | "CLOSED";

declare type TicketCategory =
  | "GENERAL"
  | "BUG_REPORT"
  | "FEATURE_REQUEST"
  | "ACCOUNT_ISSUE"
  | "PAYMENT_ISSUE"
  | "VOUCHER_ISSUE"
  | "HOSPITAL_ISSUE"
  | "BENEFICIARY_ISSUE"
  | "OTHER";

declare type TicketPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

declare interface SupportTicket {
  id: string;
  ticket_number: string;
  subject: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  created_by: string;
  created_by_email: string;
  created_by_full_name: string;
  assigned_to?: string | null;
  assigned_to_email?: string | null;
  assigned_to_full_name?: string | null;
  resolution_notes: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string | null;
  closed_at?: string | null;
  messages: TicketMessage[];
  events: TicketEvent[];
}

declare interface TicketMessage {
  id: string;
  ticket: string;
  sender: string;
  sender_email: string;
  sender_full_name: string;
  message: string;
  is_internal: boolean;
  created_at: string;
}

declare interface TicketEvent {
  id: string;
  status: string;
  changed_by: string;
  changed_by_email: string;
  changed_at: string;
  notes: string;
}

declare interface TicketCreateRequest {
  subject: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
}

declare interface TicketUpdateRequest {
  subject?: string;
  description?: string;
  category?: TicketCategory;
  priority?: TicketPriority;
}

declare interface TicketAssignRequest {
  assigned_to: string;
}

declare interface TicketStatusRequest {
  status: TicketStatus;
  resolution_notes?: string;
}

declare interface TicketCloseRequest {
  resolution_notes?: string;
}

declare interface TicketMessageRequest {
  message: string;
  is_internal?: boolean;
}

declare interface TicketStats {
  total_tickets: number;
  open_tickets: number;
  in_progress_tickets: number;
  resolved_tickets: number;
  closed_tickets: number;
  tickets_by_category: Record<TicketCategory, number>;
  tickets_by_priority: Record<TicketPriority, number>;
  average_resolution_time_hours: number;
}

declare interface TicketCategoryOption {
  value: TicketCategory;
  label: string;
}

// ── Status Display Helpers ──

declare const TICKET_STATUS_COLORS: Record<TicketStatus, string>;
declare const TICKET_PRIORITY_COLORS: Record<TicketPriority, string>;
declare const TICKET_CATEGORY_LABELS: Record<TicketCategory, string>;
