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

declare type TransactionType = "DONATION" | "PLATFORM_FEE" | "DISBURSEMENT" | "REFUND";
declare type TransactionStatus = "SUCCESSFUL" | "FAILED" | "PENDING";
declare type TransactionDirection = "IN" | "OUT";

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

declare interface WebhookEvent {
  id: number;
  gateway_id: number;
  event_type: string;
  payload: Record<string, any>;
  received_at: string;
}

// ── Disbursements ──

declare type DisbursementStatus = "PENDING" | "COMPLETED" | "FAILED" | "CANCELLED";
declare type DisbursementPaymentMethod = "MOMO" | "BANK_TRANSFER" | "CASH" | "OTHER";

declare interface Disbursement {
  id: string;
  hospital_id: string;
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
