// ── Voucher ──

declare type VoucherStatus =
  | "AVAILABLE"
  | "ACTIVE"
  | "PENDING_CONFIRMATION"
  | "USED"
  | "EXPIRED";

declare type VoucherLanguage = "fr" | "en" | "local";

declare interface Voucher {
  id: string;
  voucher_code: string;
  beneficiary_id: string;
  health_issue_id?: string | null;
  hospital_id?: string | null;
  status: VoucherStatus;
  language_preference: VoucherLanguage;
  expiry_date?: string | null;
  patient_confirmation_pin?: string;
  created_at: string;
  locked_at?: string | null;
  redeemed_at?: string | null;
  expired_at?: string | null;
  beneficiary?: Beneficiary | null;
  health_issue?: HealthIssue | null;
  beneficiary_name?: string;
  hospital_name?: string;
  hospital?: Hospital | null;
  events?: VoucherEvent[];
  funding_records?: VoucherFunding[];
}

declare interface VoucherEvent {
  id: string;
  voucher_id: string;
  status: string;
  changed_by_id?: string | null;
  changed_at: string;
  notes?: string;
}

declare interface VoucherFunding {
  id: string;
  campaign_id: string;
  committed_amount: number;
  utilized_amount: number;
  refund_amount: number;
  status: 'COMMITTED' | 'UTILIZED' | 'CANCELLED';
  committed_at: string;
  utilized_at?: string | null;
  cancelled_at?: string | null;
}

// ── Create Payloads ──

declare interface VoucherCreatePayload {
  health_issue_id: string;
  hospital_id: string;
  campaign_id: string;
  amount: number;
}

declare interface CampaignAllocationItem {
  campaign_id: string;
  amount?: number;
  percentage?: number;
}

declare interface VoucherCreateFromCampaignsPayload {
  health_issue_id: string;
  hospital_id: string;
  total_amount?: number;
  campaign_allocations: CampaignAllocationItem[];
}

declare interface VoucherCheckResponse {
  voucher_code: string;
  status: string;
  expiry_date?: string | null;
  beneficiary: Record<string, any>;
  is_valid: boolean;
  created_at: string;
}
