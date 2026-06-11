// ── Accounts ──

declare interface Account {
  id: string;
  name: string;
  balance: number;
  created_at: string;
  updated_at: string;
}

declare interface EscrowAccount extends Account {}
declare interface FeeAccount extends Account {}

// ── Fee Policies ──

declare interface FeePolicy {
  id: number;
  name: string;
  description: string;
  platform_fee_percentage: number;
  escrow_fee_percentage: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

declare interface FeePolicyCreatePayload {
  name: string;
  description?: string;
  platform_fee_percentage: number;
  escrow_fee_percentage: number;
  is_active?: boolean;
}

declare interface FeePolicyUpdatePayload {
  name?: string;
  description?: string;
  platform_fee_percentage?: number;
  escrow_fee_percentage?: number;
  is_active?: boolean;
}

// ── Payment Gateways ──

declare interface PaymentGateway {
  id: number;
  name: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

declare interface PaymentGatewayCreatePayload {
  name: string;
  description?: string;
  is_active?: boolean;
}

declare interface PaymentGatewayUpdatePayload {
  name?: string;
  description?: string;
  is_active?: boolean;
}

// ── Transactions ──

declare type TransactionType =
  | "DONATION"
  | "PLATFORM_FEE"
  | "DISBURSEMENT"
  | "REFUND";
declare type TransactionStatus = "SUCCESSFUL" | "FAILED" | "PENDING";
declare type TransactionDirection = "IN" | "OUT";

declare interface TransactionList {
  id: string;
  type: TransactionType;
  type_display: string;
  direction: TransactionDirection;
  direction_display: string;
  amount: number;
  currency: string;
  status: TransactionStatus;
  status_display: string;
  gateway_transaction_id: string;
  created_at: string;
}

declare interface Transaction {
  id: string;
  donation_id?: string | null;
  type: TransactionType;
  direction: TransactionDirection;
  amount: number;
  currency: string;
  gateway_id?: number | null;
  gateway_transaction_id: string;
  status: TransactionStatus;
  source_id?: string | null;
  destination_id?: string | null;
  metadata?: Record<string, any> | null;
  created_at: string;
  updated_at: string;
  events?: TransactionEvent[];
}

declare interface TransactionEvent {
  id: string;
  transaction_id: string;
  status: string;
  changed_by_id?: string | null;
  changed_at: string;
  notes?: string;
}

// ── Fee Splits ──

declare interface FeeSplitList {
  id: number;
  gross_amount: number;
  escrow_amount: number;
  platform_amount: number;
  fee_policy_name: string;
  created_at: string;
}

declare interface FeeSplit {
  id: number;
  transaction_id: string;
  fee_policy_id: number;
  gross_amount: number;
  escrow_amount: number;
  platform_amount: number;
  created_at: string;
}

// ── Webhook Events ──

declare interface WebhookEventList {
  id: number;
  gateway: string;
  event_type: string;
  received_at: string;
}

declare interface WebhookEvent {
  id: number;
  gateway_id: number;
  event_type: string;
  payload: Record<string, any>;
  received_at: string;
}

// ── Disbursements ──

declare type DisbursementStatus =
  | "PENDING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED";
declare type DisbursementPaymentMethod =
  | "MOMO"
  | "BANK_TRANSFER"
  | "CASH"
  | "OTHER";

declare interface Disbursement {
  id: string;
  hospital_id: string;
  hospital_name?: string;
  payment_method_display?: string;
  status_display?: string;
  created_by_name?: string;
  amount: number;
  currency: string;
  payment_method: DisbursementPaymentMethod;
  recipient_phone?: string | null;
  recipient_account?: string | null;
  status: DisbursementStatus;
  external_reference?: string | null;
  gateway_transaction_id?: string | null;
  transaction_id?: string | null;
  notes?: string | null;
  error_message?: string | null;
  metadata?: Record<string, any> | null;
  created_at: string;
  updated_at: string;
  disbursed_at?: string | null;
  created_by_id?: string | null;
}

declare interface DisbursementCreatePayload {
  hospital: string;
  amount: number;
  currency?: string;
  payment_method?: DisbursementPaymentMethod;
  recipient_phone?: string;
  recipient_account?: string;
  external_reference?: string;
  gateway_transaction_id?: string;
  transaction_id?: string;
  notes?: string;
  metadata?: Record<string, any>;
  disbursed_at?: string;
}

declare interface DisbursementUpdatePayload {
  hospital?: string;
  amount?: number;
  payment_method?: DisbursementPaymentMethod;
  recipient_phone?: string;
  recipient_account?: string;
  status?: DisbursementStatus;
  external_reference?: string;
  gateway_transaction_id?: string;
  notes?: string;
  error_message?: string;
  metadata?: Record<string, any>;
  disbursed_at?: string;
}

declare interface DisbursementStatistics {
  total_disbursed: number;
  total_pending: number;
  total_failed: number;
  by_hospital: {
    hospital_id: string;
    hospital_name: string;
    total: number;
    count: number;
  }[];
}

declare interface ProfileMinimal {
  id: string; // UUID
  full_name: string;
  email: string;
}

declare interface ClaimItem {
  id: number;
  name: string;
  amount: string; // Decimal string
}

declare interface MedicalClaimProof {
  id: number;
  file: string; // URL string
  document_type: string; // e.g., 'BILL', 'PRESCRIPTION', 'LAB_RESULT', etc.
  verification_status: string; // e.g., 'PENDING', 'VERIFIED', 'REJECTED', 'FLAGGED'
  uploaded_at: string; // ISO 8601 Date string
}
declare interface MedicalClaimDetail {
  id: number;
  voucher: number; // Voucher ID
  hospital: string; // Hospital UUID
  service_description: string;
  total_cost: string; // Decimal string
  claim_status: string; // e.g., 'PENDING', 'APPROVED', 'REJECTED'
  submitted_at: string; // ISO 8601 Date string
  submitted_by: ProfileMinimal | null;
  reviewed_at: string | null; // ISO 8601 Date string
  reviewed_by: ProfileMinimal | null;
  service_completed_at: string | null; // ISO 8601 Date string
  rejection_reason: string | null;
  claim_items: ClaimItem[];
  proofs: MedicalClaimProof[];
}
declare interface HealthIssue {
  id: number;
  beneficiary: string; // Beneficiary UUID
  social_worker: string | null; // Social Worker UUID
  validated_by: string | null; // System Admin UUID
  category: string; // e.g., 'MATERNAL', 'ELDERLY', 'EMERGENCY', 'CHRONIC', 'OTHER'
  severity: string; // e.g., 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
  status: string; // e.g., 'REPORTED', 'VALIDATED', 'WAITING', 'ASSIGNED', etc.
  description: string;
  rejection_reason: string | null;
  created_at: string; // YYYY-MM-DD Date string
  updated_at: string; // YYYY-MM-DD Date string
}

declare interface DisbursementVoucher {
  voucher_code: string;
  status: string; // e.g., 'AVAILABLE', 'ACTIVE', 'PENDING_CONFIRMATION', 'USED', 'EXPIRED'
  health_issue: HealthIssue | null;
  medical_claim: MedicalClaimDetail | null;
}

declare interface DisbursementDetail {
  id: string; // UUID
  hospital: string; // Hospital UUID
  hospital_name: string;
  hospital_email: string;
  hospital_phone: string;
  amount: string; // Decimal string
  currency: string;
  payment_method: string; // e.g., 'MOMO', 'BANK_TRANSFER', 'CASH', 'OTHER'
  payment_method_display: string;
  recipient_phone: string | null;
  recipient_account: string | null;
  status: string; // e.g., 'PENDING', 'COMPLETED', 'FAILED', 'CANCELLED'
  status_display: string;
  external_reference: string | null;
  voucher: DisbursementVoucher | null;
  voucher_code: string | null;
  gateway_transaction_id: string | null;
  transaction_details: any | null; // Keep dynamic based on Transaction model
  notes: string | null;
  error_message: string | null;
  metadata: Record<string, any> | null;
  created_at: string; // ISO 8601 Date string
  updated_at: string; // ISO 8601 Date string
  disbursed_at: string | null; // ISO 8601 Date string
  created_by: string | null; // UUID
  created_by_name: string | null;
}
