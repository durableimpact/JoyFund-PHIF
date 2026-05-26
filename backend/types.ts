// Auto-generated TypeScript definitions for Models and Serializers

// ==========================================================================
// DJANGO MODELS
// ==========================================================================

// --- App: accounts ---
export interface User {
  systemadmin?: any | null;
  hospitaladmin?: any | null;
  receptionist?: any | null;
  socialworker?: any | null;
  donor?: any | null;
  password: string;
  last_login?: string | null;
  is_superuser: boolean;
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  profile_picture?: any | null;
  phone_number: string;
  role: string;
  is_verified: boolean;
  is_active: boolean;
  is_staff: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface SystemAdmin {
  id: string;
  user_id: string;
}

export interface HospitalAdmin {
  id: string;
  user_id: string;
  national_id_number: string;
  front_national_id_image: any;
  back_national_id_image: any;
  hospital_id?: string | null;
  is_active: boolean;
  enrolled_by_id: string;
}

export interface Receptionist {
  id: string;
  user_id: string;
  national_id_number: string;
  front_national_id_image: any;
  back_national_id_image: any;
  enrolled_by_id: string;
  is_active: boolean;
  hospital_id?: string | null;
}

export interface SocialWorker {
  id: string;
  user_id: string;
  national_id_number: string;
  front_national_id_image: any;
  back_national_id_image: any;
  is_approved: boolean;
  organization: string;
  region_assigned: string;
  enrolled_by_id: string;
}

export interface Donor {
  id: string;
  user_id: string;
}

export interface EmailVerificationToken {
  id?: number;
  user_id: string;
  code: string;
  created_at?: string;
  expires_at: string;
}

export interface PasswordResetToken {
  id: string;
  user_id: string;
  code: string;
  created_at?: string;
  expires_at: string;
  is_used: boolean;
}

// --- App: beneficiaries ---
export interface Beneficiary {
  id: string;
  digital_health_id?: string | null;
  picture?: any | null;
  full_name: string;
  date_of_birth: string;
  gender: string;
  category: string;
  number_of_previous_births?: number | null;
  is_verified: boolean;
  phone: string;
  email?: string | null;
  region: string;
  city: string;
  address: string;
  lat?: number | null;
  lng?: number | null;
  national_id_number: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  emergency_contact_relationship: string;
  enrolled_by_id: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface BeneficiaryDocument {
  id?: number;
  beneficiary_id: string;
  document: any;
  description?: string;
  uploaded_at?: string;
}

export interface HealthIssue {
  id?: number;
  beneficiary_id: string;
  social_worker_id?: string | null;
  validated_by_id?: string | null;
  category: string;
  severity: string;
  status: string;
  description: string;
  rejection_reason?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface HealthIssueEvent {
  id: string;
  status: string;
  changed_by_id?: string | null;
  changed_at?: string;
  notes?: string;
  health_issue_id: number;
}

// --- App: campaigns ---
export interface Campaign {
  id: string;
  donor_id: string;
  title: string;
  slug?: string | null;
  description: string;
  cover_image?: any | null;
  event_type: string;
  goal_amount: number;
  current_amount: number;
  start_date?: string;
  end_date: string;
  is_public: boolean;
  status: string;
  certificate_generated: boolean;
  certificate_file?: any | null;
  currently_allocated: number;
  total_disbursed: number;
  is_active: boolean;
  created_at?: string;
}

export interface CampaignEvent {
  id: string;
  status: string;
  changed_by_id?: string | null;
  changed_at?: string;
  notes?: string;
  campaign_id: string;
}

export interface Payment {
  donation?: any | null;
  payment_id: string;
  payment_method: string;
  phone_number?: string;
  amount: number;
  app_amount: number;
  aggregator_fee: number;
  payment_status: string;
  payment_reference?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface PaymentEvent {
  id: string;
  status: string;
  changed_by_id?: string | null;
  changed_at?: string;
  notes?: string;
  payment_id: string;
}

export interface Donation {
  id: string;
  donor_id?: string | null;
  campaign_id: string;
  donor_name?: string | null;
  amount: number;
  status: string;
  message?: string;
  platform_fee_amount: number;
  net_amount: number;
  is_anonymous: boolean;
  payment_id: string;
  created_at?: string;
  updated_at?: string;
}

export interface DonationEvent {
  id: string;
  status: string;
  changed_by_id?: string | null;
  changed_at?: string;
  notes?: string;
  donation_id: string;
}

export interface CampaignTransaction {
  id: string;
  campaign_id: string;
  transaction_type: string;
  voucher_funding_id?: string | null;
  amount: number;
  description?: string;
  created_at?: string;
}

// --- App: hospitals ---
export interface Hospital {
  id: string;
  name: string;
  accreditation_number: string;
  licence_number: string;
  region: string;
  city: string;
  address: string;
  gps_coordinates?: any | null;
  lat?: number | null;
  lng?: number | null;
  phone_number: string;
  email: string;
  website?: string | null;
  momo_number?: string | null;
  momo_name?: string | null;
  orange_number?: string | null;
  orange_name?: string | null;
  bank_account_number?: string | null;
  bank_account_name?: string | null;
  bank_name?: string | null;
  bank_branch?: string | null;
  partnership_status: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface HospitalEvent {
  id: string;
  status: string;
  changed_by_id?: string | null;
  changed_at?: string;
  notes?: string;
  hospital_id: string;
}

export interface Services {
  id: string;
  hospital_id: string;
  name: string;
  category: string;
  price: number;
  is_available: boolean;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface MedicalClaim {
  id?: number;
  voucher_id: number;
  hospital_id?: string | null;
  service_description?: string;
  total_cost: number;
  claim_status: string;
  submitted_at?: string;
  reviewed_at?: string | null;
  service_completed_at?: string | null;
  submitted_by_id?: string | null;
  reviewed_by_id?: string | null;
  rejection_reason?: string | null;
}

export interface ClaimItem {
  id?: number;
  medical_claim_id: number;
  name: string;
  amount: number;
}

export interface MedicalClaimProof {
  id?: number;
  medical_claim_id: number;
  file: any;
  document_type: string;
  uploaded_by_id?: string | null;
  verification_status: string;
  verified_by_id?: string | null;
  verified_at?: string | null;
  rejection_reason?: string | null;
  uploaded_at?: string;
  updated_at?: string;
}

export interface MedicalClaimEvent {
  id: string;
  status: string;
  changed_by_id?: string | null;
  changed_at?: string;
  notes?: string;
  medical_claim_id: number;
}

export interface MedicalClaimProofEvent {
  id: string;
  status: string;
  changed_by_id?: string | null;
  changed_at?: string;
  notes?: string;
  medical_claim_proof_id: number;
}

export interface VoucherTopUpRequest {
  id?: number;
  medical_claim_id: number;
  requested_amount: number;
  reason: string;
  status: string;
  created_by_id?: string | null;
  reviewed_by_id?: string | null;
  review_notes?: string | null;
  created_at?: string;
  reviewed_at?: string | null;
}

export interface VoucherTopUpRequestEvent {
  id: string;
  status: string;
  changed_by_id?: string | null;
  changed_at?: string;
  notes?: string;
  voucher_top_up_request_id: number;
}

// --- App: notifications ---
export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  description?: string | null;
  notification_type: string;
  is_read: boolean;
  action_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

// --- App: payments ---
export interface Account {
  escrowaccount?: any | null;
  feeaccount?: any | null;
  polymorphic_ctype_id?: number | null;
  id: string;
  name?: string;
  balance: number;
  created_at?: string;
  updated_at?: string;
}

export interface EscrowAccount {
  polymorphic_ctype_id?: number | null;
  id: string;
  name?: string;
  balance: number;
  created_at?: string;
  updated_at?: string;
  account_ptr_id: string;
}

export interface FeeAccount {
  polymorphic_ctype_id?: number | null;
  id: string;
  name?: string;
  balance: number;
  created_at?: string;
  updated_at?: string;
  account_ptr_id: string;
}

export interface FeePolicy {
  id?: number;
  name: string;
  description?: string;
  platform_fee_percentage: number;
  escrow_fee_percentage: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface PaymentGateway {
  id?: number;
  name: string;
  description?: string;
  created_at?: string;
  is_active: boolean;
  updated_at?: string;
}

export interface WebhookEvent {
  id?: number;
  gateway_id: number;
  event_type: string;
  payload: Record<string, any>;
  received_at?: string;
}

export interface Transaction {
  fee_split?: any | null;
  disbursement?: any | null;
  id: string;
  donation_id?: string | null;
  type: string;
  direction: string;
  amount: number;
  currency: string;
  gateway_id?: number | null;
  gateway_transaction_id?: string;
  status: string;
  source_id?: string | null;
  destination_id?: string | null;
  metadata?: Record<string, any> | null;
  created_at?: string;
  updated_at?: string;
}

export interface TransactionEvent {
  id: string;
  status: string;
  changed_by_id?: string | null;
  changed_at?: string;
  notes?: string;
  transaction_id: string;
}

export interface FeeSplit {
  id?: number;
  transaction_id: string;
  fee_policy_id: number;
  gross_amount: number;
  escrow_amount: number;
  platform_amount: number;
  created_at?: string;
}

export interface Disbursement {
  id: string;
  hospital_id: string;
  amount: number;
  currency: string;
  payment_method: string;
  recipient_phone?: string | null;
  recipient_account?: string | null;
  status: string;
  external_reference?: string | null;
  gateway_transaction_id?: string | null;
  transaction_id?: string | null;
  notes?: string | null;
  error_message?: string | null;
  metadata?: Record<string, any> | null;
  created_at?: string;
  updated_at?: string;
  disbursed_at?: string | null;
  created_by_id?: string | null;
}

// --- App: vouchers ---
export interface Voucher {
  medical_claim?: any | null;
  id?: number;
  voucher_code: string;
  beneficiary_id: string;
  health_issue_id?: number | null;
  hospital_id?: string | null;
  status: string;
  language_preference: string;
  expiry_date?: string | null;
  reminder_20_sent: boolean;
  reminder_28_sent: boolean;
  patient_confirmation_pin?: string;
  created_at?: string;
  locked_at?: string | null;
  redeemed_at?: string | null;
  expired_at?: string | null;
}

export interface VoucherEvent {
  id: string;
  status: string;
  changed_by_id?: string | null;
  changed_at?: string;
  notes?: string;
  voucher_id: number;
}

export interface VoucherFunding {
  id: string;
  voucher_id: number;
  campaign_id: string;
  committed_amount: number;
  utilized_amount: number;
  refund_amount: number;
  status: string;
  committed_at?: string;
  utilized_at?: string | null;
  cancelled_at?: string | null;
}

export interface VoucherFundingEvent {
  id: string;
  status: string;
  changed_by_id?: string | null;
  changed_at?: string;
  notes?: string;
  voucher_funding_id: string;
}

export interface VoucherNotification {
  id: string;
  voucher_id: number;
  campaign_id?: string | null;
  donor_id?: string | null;
  moment: string;
  message: string;
  is_read: boolean;
  created_at?: string;
}


// ==========================================================================
// DRF SERIALIZERS
// ==========================================================================

export interface AccountSerializer {
  id?: string;
  name?: string;
  account_type?: any;
  balance?: number;
  created_at?: string;
  updated_at?: string;
}

export interface BeneficiaryCreateSerializer {
  id?: string;
  uploaded_documents?: any[];
  digital_health_id?: string | null;
  picture?: any | null;
  full_name: string;
  date_of_birth: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  category?: 'MATERNAL' | 'ELDERLY' | 'OTHER';
  number_of_previous_births?: number | null;
  is_verified?: boolean;
  phone: string;
  email?: string | null;
  region: string;
  city: string;
  address: string;
  lat?: number | null;
  lng?: number | null;
  national_id_number: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  emergency_contact_relationship: string;
  is_active?: boolean;
}

export interface BeneficiaryDetailSerializer {
  id?: string;
  digital_health_id?: string | null;
  full_name: string;
  date_of_birth: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  category?: 'MATERNAL' | 'ELDERLY' | 'OTHER';
  phone: string;
  email?: string | null;
  region: string;
  city: string;
  address: string;
  national_id_number: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  emergency_contact_relationship: string;
  enrolled_by_id?: string;
  created_at?: string;
  documents?: BeneficiaryDocumentSerializer[];
  health_issues?: HealthIssueSerializer[];
}

export interface BeneficiaryDocumentSerializer {
  id?: number;
  document: any;
  description?: string;
  uploaded_at?: string;
}

export interface BeneficiaryUpdateSerializer {
  id?: string;
  digital_health_id?: string | null;
  picture?: any | null;
  full_name: string;
  date_of_birth: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  category?: 'MATERNAL' | 'ELDERLY' | 'OTHER';
  number_of_previous_births?: number | null;
  is_verified?: boolean;
  phone: string;
  email?: string | null;
  region: string;
  city: string;
  address: string;
  lat?: number | null;
  lng?: number | null;
  national_id_number: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  emergency_contact_relationship: string;
  is_active?: boolean;
}

export interface BeneficiaryVoucherSerializer {
  total_beneficiaries: GrowthIndicatorSerializer;
  total_vouchers_generated: GrowthIndicatorSerializer;
  total_vouchers_redeemed: GrowthIndicatorSerializer;
  vouchers_over_time: TrendEntrySerializer[];
  beneficiaries_over_time: TrendEntrySerializer[];
}

export interface CampaignAllocationNestedSerializer {
  campaign_id: number;
  amount: number;
}

export interface CampaignAllocationSerializer {
  campaign_id: number | string;
  amount?: number | null;
  percentage?: number | null;
}

export interface CampaignBalanceSerializer {
  id?: string;
  title: string;
  available_balance?: number;
  status?: 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'FUNDED' | 'CLOSED' | 'CANCELLED';
  is_active?: boolean;
}

export interface CampaignCreateUpdateSerializer {
  title: string;
  description: string;
  cover_image?: any | null;
  event_type: 'BIRTHDAY' | 'WEDDING' | 'PROMOTION' | 'GRADUATION' | 'MEMORIAL';
  goal_amount: number;
  end_date: string;
  is_public?: boolean;
  status?: 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'FUNDED' | 'CLOSED' | 'CANCELLED';
  is_active?: boolean;
}

export interface CampaignDetailSerializer {
  id?: string;
  donor_id?: string;
  title: string;
  slug?: string | null;
  description: string;
  cover_image?: any | null;
  event_type: 'BIRTHDAY' | 'WEDDING' | 'PROMOTION' | 'GRADUATION' | 'MEMORIAL';
  goal_amount: number;
  available_balance?: any;
  total_net_raised?: any;
  start_date?: string;
  end_date: string;
  is_public?: boolean;
  status?: 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'FUNDED' | 'CLOSED' | 'CANCELLED';
  is_active?: boolean;
  created_at?: string;
  progress_percentage?: any;
  events?: CampaignEventSerializer[];
  transactions?: CampaignTransactionSerializer[];
  voucher_fundings?: VoucherFundingDetailSerializer[];
}

export interface CampaignEventSerializer {
  id?: string;
  status: string;
  changed_at?: string;
  notes?: string;
  changed_by?: string | null;
}

export interface CampaignTransactionSerializer {
  id?: string;
  transaction_type: 'DONATION' | 'VOUCHER_ALLOCATED' | 'HOSPITAL_SETTLED' | 'SURPLUS_REFUND' | 'VOUCHER_EXPIRED_RETURN';
  amount: number;
  description?: string;
  created_at?: string;
  voucher_funding?: number | string | null;
}

export interface ClaimItemCreateSerializer {
  name: string;
  amount: number;
}

export interface ClaimItemSerializer {
  id?: number;
  name: string;
  amount: number;
}

export interface DisbursementCreateSerializer {
  hospital: string;
  amount: number;
  payment_method?: 'MOMO' | 'BANK_TRANSFER' | 'CASH' | 'OTHER';
  recipient_phone?: string | null;
  recipient_account?: string | null;
  external_reference?: string | null;
  gateway_transaction_id?: string | null;
  notes?: string | null;
  metadata?: Record<string, any> | null;
  disbursed_at?: string | null;
}

export interface DisbursementDetailSerializer {
  id?: string;
  hospital?: number | string;
  hospital_name?: string;
  hospital_email?: string;
  hospital_phone?: string;
  amount?: number;
  currency?: string;
  payment_method?: 'MOMO' | 'BANK_TRANSFER' | 'CASH' | 'OTHER';
  payment_method_display?: string;
  recipient_phone?: string | null;
  recipient_account?: string | null;
  status?: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  status_display?: string;
  external_reference?: string | null;
  gateway_transaction_id?: string | null;
  transaction_details?: any;
  notes?: string | null;
  error_message?: string | null;
  metadata?: Record<string, any> | null;
  created_at?: string;
  updated_at?: string;
  disbursed_at?: string | null;
  created_by?: number | string | null;
  created_by_name?: string;
}

export interface DisbursementSerializer {
  id?: string;
  hospital: string;
  hospital_name?: string;
  hospital_momo?: string;
  amount: number;
  currency?: string;
  payment_method?: 'MOMO' | 'BANK_TRANSFER' | 'CASH' | 'OTHER';
  payment_method_display?: string;
  recipient_phone?: string | null;
  recipient_account?: string | null;
  status?: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  status_display?: string;
  external_reference?: string | null;
  gateway_transaction_id?: string | null;
  transaction_id?: string | null;
  notes?: string | null;
  error_message?: string | null;
  metadata?: Record<string, any> | null;
  created_at?: string;
  updated_at?: string;
  disbursed_at?: string | null;
  created_by?: string | null;
  created_by_name?: string;
}

export interface DisbursementUpdateSerializer {
  status?: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  recipient_phone?: string | null;
  recipient_account?: string | null;
  external_reference?: string | null;
  gateway_transaction_id?: string | null;
  notes?: string | null;
  error_message?: string | null;
  metadata?: Record<string, any> | null;
  disbursed_at?: string | null;
}

export interface DonationContributionSerializer {
  id: string;
  donor_name: string;
  amount: number;
  message: string | null;
  is_anonymous: boolean;
  created_at: string;
}

export interface DonationCreateSerializer {
  donor_name?: string | null;
  amount: number;
  message?: string;
  is_anonymous?: boolean;
  payment_method: string;
  phone_number: string;
  success_url: string;
  failure_url: string;
}

export interface DonationDetailSerializer {
  id?: string;
  campaign_id?: string;
  donor_id?: string | null;
  donor_name?: string | null;
  amount: number;
  status?: 'PENDING' | 'SUCCESS' | 'FAILED';
  message?: string;
  payment?: PaymentSerializer;
  events?: DonationEventSerializer[];
  is_anonymous?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface DonationEventSerializer {
  id?: string;
  status: string;
  changed_at?: string;
  notes?: string;
  changed_by?: string | null;
}

export interface DonationTrendsSerializer {
  donations_over_time: TrendEntrySerializer[];
  donations_by_month: TrendEntrySerializer[];
}

export interface DonorDashboardSerializer {
  total_raised: number;
  my_campaigns: number;
  contributors: number;
  lives_impacted: number;
}

export interface DonorDetailSerializer {
  id?: string;
  user?: UserReadSerializer;
}

export interface DonorInfoSerializer {
  id?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  profile_picture?: any | null;
  phone_number?: string;
  role?: 'SYSTEM_ADMIN' | 'HOSPITAL_ADMIN' | 'RECEPTIONIST' | 'SOCIAL_WORKER' | 'DONOR';
  is_verified?: boolean;
  created_at?: string;
  updated_at?: string;
  profile?: DonorProfileSerializer | null;
}

export interface DonorProfileSerializer {
  id: string;
}

export interface DonorRegisterSerializer {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone_number: string;
}

export interface DonorUpdateSerializer {
  email?: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
}

export interface EscrowAccountSerializer {
  id?: string;
  name?: string;
  balance?: number;
  created_at?: string;
  updated_at?: string;
}

export interface FeeAccountSerializer {
  id?: string;
  name?: string;
  balance?: number;
  created_at?: string;
  updated_at?: string;
}

export interface FeePolicySerializer {
  id?: number;
  name: string;
  description?: string;
  platform_fee_percentage: number;
  escrow_fee_percentage: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface FeeSplitSerializer {
  id?: number;
  fee_policy_name?: string;
  gross_amount?: number;
  escrow_amount?: number;
  escrow_percentage?: number;
  platform_amount?: number;
  platform_percentage?: number;
  created_at?: string;
}

export interface FinancialDashboardSerializer {
  summary: FinancialSummarySerializer;
  monthly_trends: FinancialMonthlySerializer[];
}

export interface FinancialGrowthIndicatorSerializer {
  current: number;
  previous?: number;
  change_percent: number | null;
  direction: 'up' | 'down' | 'flat';
}

export interface FinancialMonthlySerializer {
  month: string;
  donations_amount: number;
  donations_count: number;
  platform_fees: number;
  disbursements: number;
}

export interface FinancialSummarySerializer {
  escrow_balance: number;
  platform_fees_collected: number;
  total_donations_received: number;
  total_disbursements: number;
  total_donations_count: number;
}

export interface FinancialTrendEntrySerializer {
  date: string;
  value: number;
}

export interface GrowthIndicatorSerializer {
  current: number;
  previous?: number;
  change_percent: number | null;
  direction: 'up' | 'down' | 'flat';
}

export interface HealthIssueDetailSerializer {
  id?: number;
  social_worker?: SocialWorkerMinimalSerializer;
  validated_by?: SystemAdminMinimalSerializer;
  events?: HealthIssueEventSerializer[];
  category?: 'MATERNAL' | 'ELDERLY' | 'EMERGENCY' | 'CHRONIC' | 'OTHER';
  severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status?: 'REPORTED' | 'VALIDATED' | 'WAITING' | 'ASSIGNED' | 'IN_TREATMENT' | 'RESOLVED' | 'REJECTED';
  description: string;
  rejection_reason?: string | null;
  created_at?: string;
  updated_at?: string;
  beneficiary: number | string;
}

export interface HealthIssueEventSerializer {
  id?: string;
  status: string;
  changed_at?: string;
  notes?: string;
  changed_by?: string | null;
}

export interface HealthIssueRejectSerializer {
  rejection_reason: string;
}

export interface HealthIssueSerializer {
  id?: number;
  category?: 'MATERNAL' | 'ELDERLY' | 'EMERGENCY' | 'CHRONIC' | 'OTHER';
  severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status?: 'REPORTED' | 'VALIDATED' | 'WAITING' | 'ASSIGNED' | 'IN_TREATMENT' | 'RESOLVED' | 'REJECTED';
  description: string;
  rejection_reason?: string | null;
  created_at?: string;
  updated_at?: string;
  beneficiary: number | string;
  social_worker?: number | string | null;
  validated_by?: string | null;
}

export interface HealthIssueVerifySerializer {
}

export interface HospitalAdminCreateSerializer {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  national_id_number: string;
  front_national_id_image: any;
  back_national_id_image: any;
  hospital?: string | null;
}

export interface HospitalAdminDashboardSerializer {
  redeemed_vouchers: number;
  issued_vouchers: number;
  total_claims: number;
  pending_claims: number;
  number_of_staff: number;
}

export interface HospitalAdminDetailSerializer {
  id?: string;
  user?: UserReadSerializer;
  national_id_number: string;
  front_national_id_image: any;
  back_national_id_image: any;
  enrolled_by_id?: string;
  hospital_id?: string | null;
}

export interface HospitalAdminInfoSerializer {
  id?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  profile_picture?: any | null;
  phone_number?: string;
  role?: 'SYSTEM_ADMIN' | 'HOSPITAL_ADMIN' | 'RECEPTIONIST' | 'SOCIAL_WORKER' | 'DONOR';
  is_verified?: boolean;
  created_at?: string;
  updated_at?: string;
  profile?: HospitalAdminProfileSerializer | null;
  hospital?: any;
}

export interface HospitalAdminProfileSerializer {
  id: string;
  national_id_number: string;
  front_national_id_image?: string | null;
  back_national_id_image?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface HospitalAdminUpdateSerializer {
  email?: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  national_id_number?: string;
  front_national_id_image?: any;
  back_national_id_image?: any;
  hospital?: string | null;
}

export interface HospitalCreateUpdateSerializer {
  name: string;
  accreditation_number: string;
  licence_number: string;
  region: string;
  city: string;
  address: string;
  gps_coordinates?: any | null;
  lat?: number | null;
  lng?: number | null;
  phone_number: string;
  email: string;
  website?: string;
  momo_number?: string | null;
  momo_name?: string | null;
  orange_number?: string | null;
  orange_name?: string | null;
  bank_account_number?: string | null;
  bank_account_name?: string | null;
  bank_name?: string | null;
  bank_branch?: string | null;
  partnership_status?: 'PENDING' | 'ACTIVE' | 'INACTIVE' | 'REJECTED';
  is_active?: boolean;
}

export interface HospitalDetailSerializer {
  id?: string;
  name: string;
  accreditation_number: string;
  licence_number: string;
  region: string;
  city: string;
  address: string;
  gps_coordinates?: any | null;
  phone_number: string;
  email: string;
  website?: string | null;
  momo_number?: string | null;
  momo_name?: string | null;
  orange_number?: string | null;
  orange_name?: string | null;
  bank_account_number?: string | null;
  bank_account_name?: string | null;
  bank_name?: string | null;
  bank_branch?: string | null;
  partnership_status?: 'PENDING' | 'ACTIVE' | 'INACTIVE' | 'REJECTED';
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  admins?: any;
}

export interface HospitalListSerializer {
  id?: string;
  name: string;
  city: string;
  region: string;
  phone_number: string;
  email: string;
  partnership_status?: 'PENDING' | 'ACTIVE' | 'INACTIVE' | 'REJECTED';
  is_active?: boolean;
  created_at?: string;
}

export interface HospitalManagerSerializer {
  id?: string;
  user_id?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone_number?: string;
}

export interface HospitalSummarySerializer {
  id: string;
  name: string;
  city: string;
  status: string;
  staff_count: number;
  vouchers_redeemed: number;
}

export interface MatchedBeneficiarySerializer {
  id: string;
  digital_health_id: string;
  full_name: string;
  picture: any | null;
  category: string;
  voucher_status: string | null;
}

export interface MedicalClaimAddItemsSerializer {
  claim_items: ClaimItemCreateSerializer[];
}

export interface MedicalClaimApproveSerializer {
  approval_notes?: string;
}

export interface MedicalClaimCreateSerializer {
  id?: number;
  voucher: number | string;
  hospital?: string | null;
  service_description?: string;
  claim_items: ClaimItemCreateSerializer[];
}

export interface MedicalClaimDetailSerializer {
  id?: number;
  voucher: number | string;
  hospital?: string | null;
  service_description?: string;
  total_cost?: number;
  claim_status?: 'PENDING' | 'APPROVED' | 'REJECTED';
  submitted_at?: string;
  submitted_by?: number | string | null;
  reviewed_at?: string | null;
  reviewed_by?: number | string | null;
  service_completed_at?: string | null;
  rejection_reason?: string | null;
  claim_items?: ClaimItemSerializer[];
  proofs?: MedicalClaimProofSerializer[];
}

export interface MedicalClaimEventSerializer {
  id?: string;
  status: string;
  changed_at?: string;
  notes?: string;
  changed_by?: string | null;
}

export interface MedicalClaimFinalVerifySerializer {
  approval_notes?: string;
}

export interface MedicalClaimProofCreateSerializer {
  file: any;
  document_type: 'BILL' | 'PRESCRIPTION' | 'LAB_RESULT' | 'DISCHARGE' | 'IMAGING' | 'OTHER';
}

export interface MedicalClaimProofEventSerializer {
  id?: string;
  status: string;
  changed_at?: string;
  notes?: string;
  changed_by?: string | null;
}

export interface MedicalClaimProofFlagSerializer {
  rejection_reason: string;
}

export interface MedicalClaimProofRejectSerializer {
  rejection_reason: string;
}

export interface MedicalClaimProofSerializer {
  id?: number;
  file: any;
  document_type: 'BILL' | 'PRESCRIPTION' | 'LAB_RESULT' | 'DISCHARGE' | 'IMAGING' | 'OTHER';
  verification_status?: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'FLAGGED';
  uploaded_at?: string;
}

export interface MedicalClaimProofVerifySerializer {
}

export interface MedicalClaimRejectSerializer {
  rejection_reason: string;
}

export interface NotificationListSerializer {
  id?: string;
  user_email?: string;
  title: string;
  message: string;
  notification_type?: 'WELCOME' | 'SYSTEM' | 'ANNOUNCEMENT' | 'ALERT' | 'CAMPAIGN_UPDATE' | 'DONATION_RECEIVED' | 'DONATION_SENT' | 'BENEFICIARY_UPDATE' | 'PAYMENT_NOTIFICATION' | 'VERIFICATION_STATUS';
  is_read?: boolean;
  created_at?: string;
}

export interface NotificationSerializer {
  id?: string;
  user_id?: string;
  user_email?: string;
  title: string;
  message: string;
  description?: string | null;
  notification_type?: 'WELCOME' | 'SYSTEM' | 'ANNOUNCEMENT' | 'ALERT' | 'CAMPAIGN_UPDATE' | 'DONATION_RECEIVED' | 'DONATION_SENT' | 'BENEFICIARY_UPDATE' | 'PAYMENT_NOTIFICATION' | 'VERIFICATION_STATUS';
  is_read?: boolean;
  action_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface OrganizationDashboardSerializer {
  total_hospitals: GrowthIndicatorSerializer;
  total_hospital_admins: GrowthIndicatorSerializer;
  total_social_workers: GrowthIndicatorSerializer;
  total_receptionists: GrowthIndicatorSerializer;
  hospitals_by_status: Record<string, any>[];
  top_hospitals: HospitalSummarySerializer[];
}

export interface OverviewKpiSerializer {
  escrow_balance: GrowthIndicatorSerializer;
  total_donations: FinancialGrowthIndicatorSerializer;
  total_beneficiaries: GrowthIndicatorSerializer;
  total_vouchers: GrowthIndicatorSerializer;
  total_users: GrowthIndicatorSerializer;
  total_hospitals: GrowthIndicatorSerializer;
}

export interface PasswordChangeSerializer {
  old_password: string;
  new_password: string;
  confirm_password: string;
}

export interface PasswordResetConfirmSerializer {
  code: string;
  new_password: string;
  confirm_password: string;
}

export interface PasswordResetRequestSerializer {
  email: string;
}

export interface PaymentEventSerializer {
  id?: string;
  status: string;
  changed_at?: string;
  notes?: string;
  changed_by?: string | null;
}

export interface PaymentGatewaySerializer {
  id?: number;
  name: string;
  description?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface PaymentSerializer {
  payment_id?: string;
  payment_method: 'MTN' | 'ORANGE';
  phone_number?: string;
  amount: number;
  payment_status?: 'PENDING' | 'SUCCESS' | 'FAILED';
  payment_reference?: string | null;
  events?: PaymentEventSerializer[];
  created_at?: string;
  updated_at?: string;
}

export interface PeriodSummarySerializer {
  new_users: number;
  new_beneficiaries: number;
  vouchers_generated: number;
  vouchers_redeemed: number;
  donations_count: number;
  donations_amount: number;
  platform_fees: number;
}

export interface ReceptionistCreateSerializer {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  national_id_number: string;
  front_national_id_image: any;
  back_national_id_image: any;
  hospital?: string | null;
}

export interface ReceptionistDashboardSerializer {
  redeemed_vouchers: number;
  total_medical_claims: number;
  pending_claims: number;
  approved_claims: number;
  rejected_claims: number;
  uploaded_proofs: number;
}

export interface ReceptionistDetailSerializer {
  id?: string;
  user?: UserReadSerializer;
  national_id_number: string;
  front_national_id_image: any;
  back_national_id_image: any;
  enrolled_by_id?: string;
  hospital_id?: string | null;
}

export interface ReceptionistInfoSerializer {
  id?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  profile_picture?: any | null;
  phone_number?: string;
  role?: 'SYSTEM_ADMIN' | 'HOSPITAL_ADMIN' | 'RECEPTIONIST' | 'SOCIAL_WORKER' | 'DONOR';
  is_verified?: boolean;
  created_at?: string;
  updated_at?: string;
  profile?: ReceptionistProfileSerializer | null;
  hospital?: any;
}

export interface ReceptionistProfileSerializer {
  id: string;
  national_id_number: string;
  front_national_id_image?: string | null;
  back_national_id_image?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ReceptionistUpdateSerializer {
  email?: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  national_id_number?: string;
  front_national_id_image?: any;
  back_national_id_image?: any;
  hospital?: string | null;
}

export interface ServiceCreateUpdateSerializer {
  name: string;
  category?: 'GENERAL' | 'MATERNITY' | 'PEDIATRIC' | 'LAB' | 'IMAGING' | 'PHARMACY' | 'SURGERY' | 'EMERGENCY' | 'CHRONIC' | 'VACCINATION' | 'DENTAL' | 'OTHER';
  price: number;
  is_available?: boolean;
  description?: string;
}

export interface ServiceDetailSerializer {
  id?: string;
  hospital_id?: string;
  name: string;
  category?: 'GENERAL' | 'MATERNITY' | 'PEDIATRIC' | 'LAB' | 'IMAGING' | 'PHARMACY' | 'SURGERY' | 'EMERGENCY' | 'CHRONIC' | 'VACCINATION' | 'DENTAL' | 'OTHER';
  price: number;
  is_available?: boolean;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SocialWorkerCreateSerializer {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  national_id_number: string;
  front_national_id_image: any;
  back_national_id_image: any;
  organization: string;
  region_assigned: string;
}

export interface SocialWorkerDashboardSerializer {
  enrolled: number;
  awaiting_match: number;
  voucher_issued: number;
  care_received: number;
}

export interface SocialWorkerDetailSerializer {
  id?: string;
  user?: UserReadSerializer;
  national_id_number: string;
  front_national_id_image: any;
  back_national_id_image: any;
  organization: string;
  region_assigned: string;
  is_approved?: boolean;
  enrolled_by_id?: string;
}

export interface SocialWorkerInfoSerializer {
  id?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  profile_picture?: any | null;
  phone_number?: string;
  role?: 'SYSTEM_ADMIN' | 'HOSPITAL_ADMIN' | 'RECEPTIONIST' | 'SOCIAL_WORKER' | 'DONOR';
  is_verified?: boolean;
  created_at?: string;
  updated_at?: string;
  profile?: SocialWorkerProfileSerializer | null;
}

export interface SocialWorkerMinimalSerializer {
  id?: string;
  full_name?: string;
  organization: string;
  profile_picture?: any;
}

export interface SocialWorkerProfileSerializer {
  id: string;
  national_id_number: string;
  front_national_id_image?: string | null;
  back_national_id_image?: string | null;
  organization: string;
  region_assigned: string;
  created_at?: string;
  updated_at?: string;
}

export interface SocialWorkerUpdateSerializer {
  email?: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  national_id_number?: string;
  front_national_id_image?: any;
  back_national_id_image?: any;
  organization?: string;
  region_assigned?: string;
  is_approved?: boolean;
}

export interface StaffSerializer {
  id: string;
  name: string;
  email: string;
  profile_picture?: any;
  is_active: boolean;
  role: string;
}

export interface SystemAdminInfoSerializer {
  id?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  profile_picture?: any | null;
  phone_number?: string;
  role?: 'SYSTEM_ADMIN' | 'HOSPITAL_ADMIN' | 'RECEPTIONIST' | 'SOCIAL_WORKER' | 'DONOR';
  is_verified?: boolean;
  created_at?: string;
  updated_at?: string;
  profile?: SystemAdminProfileSerializer | null;
}

export interface SystemAdminMinimalSerializer {
  id?: string;
  full_name?: string;
  profile_picture?: any;
}

export interface SystemAdminProfileSerializer {
  id: string;
}

export interface TransactionSerializer {
  id?: string;
  type?: 'DONATION' | 'PLATFORM_FEE' | 'DISBURSEMENT' | 'REFUND';
  type_display?: string;
  direction?: 'IN' | 'OUT';
  direction_display?: string;
  amount?: number;
  currency?: string;
  gateway?: number | string | null;
  gateway_transaction_id?: string;
  status?: 'SUCCESSFUL' | 'FAILED' | 'PENDING';
  status_display?: string;
  donation?: any;
  source?: any;
  destination?: any;
  metadata?: Record<string, any> | null;
  fee_split?: FeeSplitSerializer;
  created_at?: string;
  updated_at?: string;
}

export interface TrendEntrySerializer {
  date: string;
  value: number;
}

export interface TrendsReportSerializer {
  period_start: string;
  period_end: string;
  summary: PeriodSummarySerializer;
  user_registrations: TrendEntrySerializer[];
  donations: FinancialTrendEntrySerializer[];
  vouchers: TrendEntrySerializer[];
  daily_breakdown: Record<string, any>[];
}

export interface UserGrowthSerializer {
  total_users: GrowthIndicatorSerializer;
  donors: GrowthIndicatorSerializer;
  hospital_admins: GrowthIndicatorSerializer;
  receptionists: GrowthIndicatorSerializer;
  social_workers: GrowthIndicatorSerializer;
  system_admins: GrowthIndicatorSerializer;
  registrations_over_time: TrendEntrySerializer[];
}

export interface UserReadSerializer {
  id?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  profile_picture?: any | null;
  phone_number?: string;
  role?: 'SYSTEM_ADMIN' | 'HOSPITAL_ADMIN' | 'RECEPTIONIST' | 'SOCIAL_WORKER' | 'DONOR';
  is_verified?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface VoucherApproveSerializer {
  approval_notes?: string;
}

export interface VoucherCheckSerializer {
  voucher_code?: string;
  status?: 'AVAILABLE' | 'ACTIVE' | 'PENDING_CONFIRMATION' | 'USED' | 'EXPIRED';
  expiry_date?: string | null;
  beneficiary?: BeneficiaryDetailSerializer;
  is_valid?: any;
  created_at?: string;
}

export interface VoucherConfirmPinSerializer {
  patient_pin: string;
}

export interface VoucherCreateMultipleCampaignsSerializer {
  id?: number;
  voucher_code?: string;
  status?: 'AVAILABLE' | 'ACTIVE' | 'PENDING_CONFIRMATION' | 'USED' | 'EXPIRED';
  health_issue_id: number | string;
  hospital_id: string;
  total_amount?: number | null;
  campaign_allocations: CampaignAllocationSerializer[];
}

export interface VoucherCreateSerializer {
  id?: number;
  voucher_code?: string;
  status?: 'AVAILABLE' | 'ACTIVE' | 'PENDING_CONFIRMATION' | 'USED' | 'EXPIRED';
  health_issue_id: number | string;
  hospital_id: string;
  campaign_id: number | string;
  amount: number;
}

export interface VoucherDetailSerializer {
  id?: number;
  beneficiary?: BeneficiaryDetailSerializer;
  hospital?: HospitalListSerializer;
  events?: VoucherEventSerializer[];
  funding_records?: VoucherFundingSerializer[];
  voucher_code?: string;
  status?: 'AVAILABLE' | 'ACTIVE' | 'PENDING_CONFIRMATION' | 'USED' | 'EXPIRED';
  language_preference?: 'fr' | 'en' | 'local';
  expiry_date?: string | null;
  reminder_20_sent?: boolean;
  reminder_28_sent?: boolean;
  patient_confirmation_pin?: string;
  created_at?: string;
  locked_at?: string | null;
  redeemed_at?: string | null;
  expired_at?: string | null;
  health_issue?: number | string | null;
}

export interface VoucherEventSerializer {
  id?: string;
  status: string;
  changed_at?: string;
  notes?: string;
  changed_by?: string | null;
}

export interface VoucherFundingDetailSerializer {
  id?: string;
  events?: VoucherFundingEventSerializer[];
  voucher?: VoucherMinimalSerializer;
  committed_amount: number;
  utilized_amount: number;
  refund_amount: number;
  status?: 'COMMITTED' | 'UTILIZED' | 'CANCELLED';
  committed_at?: string;
  utilized_at?: string | null;
  cancelled_at?: string | null;
  campaign: number | string;
}

export interface VoucherFundingEventSerializer {
  id?: string;
  status: string;
  changed_at?: string;
  notes?: string;
  changed_by?: string | null;
}

export interface VoucherFundingSerializer {
  id?: string;
  events?: VoucherFundingEventSerializer[];
  committed_amount: number;
  utilized_amount: number;
  refund_amount: number;
  status?: 'COMMITTED' | 'UTILIZED' | 'CANCELLED';
  committed_at?: string;
  utilized_at?: string | null;
  cancelled_at?: string | null;
  campaign: number | string;
}

export interface VoucherListSerializer {
  id?: number;
  voucher_code?: string;
  beneficiary: number | string;
  beneficiary_name?: string;
  hospital?: string | null;
  hospital_name?: string;
  status?: 'AVAILABLE' | 'ACTIVE' | 'PENDING_CONFIRMATION' | 'USED' | 'EXPIRED';
  expiry_date?: string | null;
  created_at?: string;
}

export interface VoucherMinimalSerializer {
  id?: number;
  hospital?: string;
  beneficiary_name?: string;
  voucher_code?: string;
  events?: VoucherEventSerializer[];
  status?: 'AVAILABLE' | 'ACTIVE' | 'PENDING_CONFIRMATION' | 'USED' | 'EXPIRED';
  created_at?: string;
  redeemed_at?: string | null;
}

export interface VoucherTopUpRequestApproveSerializer {
  campaign_allocations: CampaignAllocationNestedSerializer[];
  review_notes?: string;
}

export interface VoucherTopUpRequestCreateSerializer {
  medical_claim: number | string;
  requested_amount: number;
  reason: string;
}

export interface VoucherTopUpRequestEventSerializer {
  id?: string;
  status: string;
  changed_at?: string;
  notes?: string;
  changed_by?: string | null;
}

export interface VoucherTopUpRequestRejectSerializer {
  review_notes: string;
}

export interface VoucherTopUpRequestSerializer {
  id?: number;
  medical_claim: number | string;
  requested_amount: number;
  reason: string;
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';
  created_by?: string | null;
  reviewed_by?: number | string | null;
  review_notes?: string | null;
  created_at?: string;
  reviewed_at?: string | null;
  events?: VoucherTopUpRequestEventSerializer[];
}

export interface WebhookEventSerializer {
  id?: number;
  gateway?: any;
  event_type?: string;
  payload?: Record<string, any>;
  received_at?: string;
}

export interface PlatformStatsSerializer {
  lives_supported: number;
  active_campaigns: number;
  total_raised: string;
}
