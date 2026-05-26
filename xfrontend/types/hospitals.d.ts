// ── Hospital ──

declare type PartnershipStatus = "PENDING" | "ACTIVE" | "INACTIVE" | "REJECTED";

declare interface Hospital {
  id: string;
  name: string;
  accreditation_number: string;
  licence_number: string;
  region: string;
  city: string;
  address: string;
  gps_coordinates?: string;
  lat?: number | null;
  lng?: number | null;
  phone_number: string;
  email: string;
  website?: string | null;
  momo_number?: string;
  momo_name?: string;
  orange_number?: string;
  orange_name?: string;
  bank_account_number?: string;
  bank_account_name?: string;
  bank_name?: string;
  bank_branch?: string;
  partnership_status: PartnershipStatus;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  admins?: HospitalManager[];
}

declare interface HospitalManager {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
}

declare interface HospitalCreatePayload {
  name: string;
  accreditation_number: string;
  licence_number: string;
  region: string;
  city: string;
  address: string;
  gps_coordinates?: string;
  lat?: number;
  lng?: number;
  phone_number: string;
  email: string;
  website?: string;
  momo_number?: string;
  momo_name?: string;
  orange_number?: string;
  orange_name?: string;
  bank_account_number?: string;
  bank_account_name?: string;
  bank_name?: string;
  bank_branch?: string;
  partnership_status?: PartnershipStatus;
  is_active?: boolean;
}

declare interface HospitalDashboardResponse {
  total_services: number;
  total_vouchers_redeemed: number;
  total_claims_processed: number;
  pending_claims: number;
  monthly_redeemed: number;
}

declare interface HospitalRedeemedDaily {
  date: string;
  count: number;
}

declare interface RedeemedVouchersTotalResponse {
  hospital_id: string;
  hospital_name: string;
  total_redeemed: number;
}

declare interface StaffMember {
  id: string;
  name: string;
  email: string;
  profile_picture?: string | null;
  is_active: boolean;
  role: string;
}

// ── Services ──

declare type ServiceCategory =
  | "GENERAL"
  | "MATERNITY"
  | "PEDIATRIC"
  | "LAB"
  | "IMAGING"
  | "PHARMACY"
  | "SURGERY"
  | "EMERGENCY"
  | "CHRONIC"
  | "VACCINATION"
  | "DENTAL"
  | "OTHER";

declare interface Service {
  id: string;
  hospital_id: string;
  name: string;
  category: ServiceCategory;
  price: number;
  is_available: boolean;
  description: string;
  created_at: string;
  updated_at: string;
}

declare interface ServiceCreatePayload {
  name: string;
  category: ServiceCategory;
  price: number;
  is_available?: boolean;
  description?: string;
}

// ── Medical Claims ──

declare type ClaimStatus = "PENDING" | "APPROVED" | "REJECTED";
declare type VerificationStatus = "PENDING" | "VERIFIED" | "REJECTED" | "FLAGGED";
declare type DocumentType = "BILL" | "PRESCRIPTION" | "LAB_RESULT" | "DISCHARGE" | "IMAGING" | "OTHER";

declare interface MedicalClaim {
  id: string;
  voucher_id: string;
  hospital_id: string;
  service_description: string;
  total_cost: number;
  claim_status: ClaimStatus;
  submitted_at: string;
  submitted_by_id: string;
  reviewed_at?: string | null;
  reviewed_by_id?: string | null;
  service_completed_at?: string | null;
  rejection_reason?: string | null;
  claim_items: ClaimItem[];
  proofs: MedicalClaimProof[];
  events?: MedicalClaimEvent[];
}

declare interface MedicalClaimEvent {
  id: string;
  medical_claim_id: string;
  status: string;
  changed_by_id?: string | null;
  changed_at: string;
  notes?: string;
}

declare interface MedicalClaimCreatePayload {
  voucher: string;
  hospital: string;
  service_description: string;
  claim_items: ClaimItemCreatePayload[];
}

declare interface MedicalClaimAddItemsPayload {
  claim_items: ClaimItemCreatePayload[];
}

declare interface ClaimItem {
  id: number;
  name: string;
  amount: number;
}

declare interface ClaimItemCreatePayload {
  name: string;
  amount: number;
}

declare interface MedicalClaimProof {
  id: string;
  file: string;
  document_type: DocumentType;
  verification_status: VerificationStatus;
  uploaded_at: string;
  events?: MedicalClaimProofEvent[];
}

declare interface MedicalClaimProofEvent {
  id: string;
  medical_claim_proof_id: string;
  status: string;
  changed_by_id?: string | null;
  changed_at: string;
  notes?: string;
}

declare interface MedicalClaimProofCreatePayload {
  file: File;
  document_type: DocumentType;
}

declare interface MedicalClaimProofActionPayload {
  rejection_reason?: string;
}

// ── Voucher Top-Up ──

declare type VoucherTopUpStatus = "PENDING" | "APPROVED" | "REJECTED";

declare interface VoucherTopUpRequest {
  id: string;
  medical_claim_id: string;
  requested_amount: number;
  reason: string;
  status: VoucherTopUpStatus;
  created_by_id: string;
  reviewed_by_id?: string | null;
  review_notes?: string;
  created_at: string;
  reviewed_at?: string | null;
  events?: VoucherTopUpEvent[];
}

declare interface VoucherTopUpEvent {
  id: string;
  voucher_top_up_request_id: string;
  status: string;
  changed_by_id?: string | null;
  changed_at: string;
  notes?: string;
}

declare interface VoucherTopUpCreatePayload {
  medical_claim: string;
  requested_amount: number;
  reason: string;
}

declare interface VoucherTopUpActionPayload {
  review_notes?: string;
}
