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
  beneficiary?: {
    id: string;
    digital_health_id?: string | null;
    full_name: string;
  };
  health_issue?: {
    id: string;
    description: string;
    category: string;
    severity: string;
    status: string;
  };
}

declare interface VoucherEvent {
  id: string;
  voucher_id: string;
  status: string;
  changed_by_id?: string | null;
  changed_at: string;
  notes?: string;
}

declare interface VoucherCreatePayload {
  beneficiary_id: string;
  health_issue_id?: string;
  hospital_id?: string;
  language_preference?: VoucherLanguage;
}

declare interface VoucherCreateFromCampaignsPayload {
  campaign_ids: string[];
}

declare interface VoucherCheckResponse {
  exists: boolean;
  voucher?: Voucher;
}

declare type VoucherNotificationMoment =
  | "VOUCHER_ISSUED"
  | "VOUCHER_APPROVED"
  | "VOUCHER_REJECTED"
  | "VOUCHER_REDEEMED"
  | "VOUCHER_EXPIRED";

declare interface VoucherNotification {
  id: string;
  voucher_id: string;
  campaign_id?: string | null;
  donor_id?: string | null;
  moment: VoucherNotificationMoment;
  message: string;
  is_read: boolean;
  created_at: string;
}

declare interface VoucherApproveResponse {
  success: boolean;
  message: string;
  pin: string;
}

declare interface VoucherConfirmPinPayload {
  pin: string;
}

declare interface VoucherConfirmPinResponse {
  success: boolean;
  message: string;
}
