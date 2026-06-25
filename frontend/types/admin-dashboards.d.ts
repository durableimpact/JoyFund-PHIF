// ── Reusable Trend / Growth Types ──

declare interface TrendEntry {
  date: string;
  value: number;
}

declare interface FinancialTrendEntry {
  date: string;
  value: number;
}

declare type GrowthDirection = "up" | "down" | "flat";

declare interface GrowthIndicator {
  current: number;
  previous: number;
  change_percent?: number | null;
  direction: GrowthDirection;
}

declare interface FinancialGrowthIndicator {
  current: number;
  previous: number;
  change_percent?: number | null;
  direction: GrowthDirection;
}

// ── Admin Overview Dashboard ──

declare interface OverviewKpi {
  escrow_balance: GrowthIndicator;
  total_donations: FinancialGrowthIndicator;
  total_beneficiaries: GrowthIndicator;
  total_vouchers: GrowthIndicator;
  total_users: GrowthIndicator;
  total_hospitals: GrowthIndicator;
  total_campaigns:GrowthIndicator;
}

// ── Financial Dashboard ──

declare interface FinancialSummary {
  escrow_balance: number;
  platform_fees_collected: number;
  total_donations_received: number;
  total_disbursements: number;
  total_donations_count: number;
}

declare interface FinancialMonthly {
  month: string;
  donations_amount: number;
  donations_count: number;
  platform_fees: number;
  disbursements: number;
}

declare interface FinancialDashboard {
  summary: FinancialSummary;
  monthly_trends: FinancialMonthly[];
}

// ── Donation Trends ──

declare interface DonationTrends {
  donations_over_time: TrendEntry[];
  donations_by_month: TrendEntry[];
}

// ── User Analytics ──

declare interface UserGrowth {
  total_users: GrowthIndicator;
  donors: GrowthIndicator;
  hospital_admins: GrowthIndicator;
  receptionists: GrowthIndicator;
  social_workers: GrowthIndicator;
  system_admins: GrowthIndicator;
  registrations_over_time: TrendEntry[];
}

// ── Beneficiary & Voucher ──

declare interface BeneficiaryVoucher {
  total_beneficiaries: GrowthIndicator;
  total_vouchers_generated: GrowthIndicator;
  total_vouchers_redeemed: GrowthIndicator;
  vouchers_over_time: TrendEntry[];
  beneficiaries_over_time: TrendEntry[];
}

// ── Organization ──

declare interface HospitalSummary {
  id: string;
  name: string;
  city: string;
  status: string;
  staff_count: number;
  vouchers_redeemed: number;
}

declare interface OrganizationDashboard {
  total_hospitals: GrowthIndicator;
  total_hospital_admins: GrowthIndicator;
  total_social_workers: GrowthIndicator;
  total_receptionists: GrowthIndicator;
  hospitals_by_status: { status: string; count: number }[];
  top_hospitals: HospitalSummary[];
}

// ── Trends Report ──

declare interface PeriodSummary {
  new_users: number;
  new_beneficiaries: number;
  vouchers_generated: number;
  vouchers_redeemed: number;
  donations_count: number;
  donations_amount: number;
  platform_fees: number;
}

declare interface TrendsReport {
  period_start: string;
  period_end: string;
  summary: PeriodSummary;
  user_registrations: TrendEntry[];
  donations: FinancialTrendEntry[];
  vouchers: TrendEntry[];
  daily_breakdown: { date: string; users: number; donations: number; vouchers: number }[];
}

// ── Role-Specific Dashboards ──

declare interface DonorDashboardSerializer {
  total_raised: number;
  my_campaigns: number;
  contributors: number;
  lives_impacted: number;
}

declare interface SocialWorkerDashboardSerializer {
  enrolled: number;
  awaiting_match: number;
  voucher_issued: number;
  care_received: number;
}

declare interface ReceptionistDashboardSerializer {
  redeemed_vouchers: number;
  total_medical_claims: number;
  pending_claims: number;
  approved_claims: number;
  rejected_claims: number;
  uploaded_proofs: number;
}

declare interface HospitalAdminDashboardSerializer {
  redeemed_vouchers: number;
  issued_vouchers: number;
  total_claims: number;
  pending_claims: number;
  number_of_staff: number;
}

declare interface SystemAdminDashboardSerializer {
  total_users: number;
  total_hospitals: number;
  total_donors: number;
  total_beneficiaries: number;
  total_donations: number;
  total_vouchers_issued: number;
  total_vouchers_redeemed: number;
  pending_claims: number;
  escrow_balance: number;
}


declare interface UserMinimal {
  id: string
  first_name: string
  last_name: string
  profile_picture: string | null
}

declare interface DonorMinimal {
  id: string
  user: UserMinimal
}

declare interface CampaignMinimal {
  id: string
  title: string
  slug: string | null
  goal_amount: number
  current_amount: number
  status: string
  is_public: boolean
  start_date: string
  end_date: string
  created_at: string
}

declare interface DonationMinimal {
  id: string
  campaign_id: string
  campaign_title: string
  campaign_slug: string | null
  donor_name: string
  amount: number
  status: string
  message: string
  is_anonymous: boolean
  created_at: string
}

declare interface DonorPublicSummary {
  donor: DonorMinimal
  campaign_count: number
  donations_count: number
  donations_total_amount: number
  campaigns: CampaignMinimal[]
  donations: DonationMinimal[]
}

// ── User Role Summary ──

declare interface UserRoleCount {
  role: string
  label: string
  count: number
  color: string
}

declare interface UserRoleSummary {
  total_users: number
  roles: UserRoleCount[]
}

// ── Comprehensive Analytics Dashboard ──

declare interface CampaignPerformance {
  total_campaigns: number
  active_campaigns: number
  funded_campaigns: number
  closed_campaigns: number
  total_raised: number
  avg_donation: number
  completion_rate: number
  campaigns_over_time: TrendEntry[]
}

declare interface VoucherAnalytics {
  total_generated: GrowthIndicator
  total_redeemed: GrowthIndicator
  redemption_rate: number
  vouchers_over_time: TrendEntry[]
  by_hospital: { hospital: string; count: number }[]
}

declare interface HospitalNetwork {
  total_hospitals: GrowthIndicator
  hospitals_by_status: { status: string; count: number }[]
  top_hospitals: HospitalSummary[]
  hospitals_over_time: TrendEntry[]
}

declare interface ComprehensiveAnalytics {
  executive_summary: OverviewKpi
  user_growth: UserGrowth
  donation_analytics: DonationTrends
  campaign_performance: CampaignPerformance
  voucher_analytics: VoucherAnalytics
  financial_overview: FinancialDashboard
  hospital_network: HospitalNetwork
  daily_activity: TrendsReport
}

// ── Admin User Detail ──

declare interface AdminUserDevice {
  id: string
  device_name: string
  device_type: string
  browser: string
  os: string
  ip_address: string
  last_active: string | null
  is_trusted: boolean
  is_blocked: boolean
  created_at: string
}

declare interface AdminUserCampaign {
  id: string
  title: string
  status: string
  goal_amount: number
  current_amount: number
  progress_percentage: number
  created_at: string
}

declare interface AdminUserDonation {
  id: string
  campaign_title: string
  amount: number
  net_amount: number
  status: string
  donor_name: string
  created_at: string
}

declare interface AdminUserBeneficiary {
  id: string
  full_name: string
  digital_health_id: string
  gender: string
  category: string
  region: string
  city: string
  is_verified: boolean
  is_active: boolean
  created_at: string
}

declare interface AdminUserHealthIssue {
  id: string
  category: string
  severity: string
  status: string
  description: string
  beneficiary_name: string
  created_at: string
}

declare interface AdminUserClaim {
  id: string
  voucher_code: string
  total_cost: number
  claim_status: string
  service_description: string
  hospital_name: string
  submitted_at: string
}

declare interface AdminUserReceptionist {
  id: string
  first_name: string
  last_name: string
  email: string
  is_active: boolean
  hospital_name: string
}

declare interface AdminUserDetail {
  user: {
    id: string
    email: string
    first_name: string
    last_name: string
    phone_number: string
    role: string
    is_verified: boolean
    is_active: boolean
    is_staff: boolean
    profile_picture: string | null
    created_at: string
    updated_at: string
  }
  profile: {
    id: string
    national_id_number?: string
    front_national_id_image?: string | null
    back_national_id_image?: string | null
    is_active?: boolean
    is_approved?: boolean
    organization?: string
    region_assigned?: string
    hospital_id?: string | null
    enrolled_by_id?: string | null
  } | null
  devices: AdminUserDevice[]
  donor_stats: {
    total_raised: number
    my_campaigns: number
    contributors: number
    lives_impacted: number
  } | null
  campaigns: AdminUserCampaign[]
  recent_donations: AdminUserDonation[]
  hospital_stats: {
    redeemed_vouchers: number
    issued_vouchers: number
    total_claims: number
    pending_claims: number
    number_of_staff: number
  } | null
  hospital_info: {
    id: string
    name: string
    city: string
    partnership_status: string
  } | null
  hospital_receptionists: AdminUserReceptionist[]
  social_worker_stats: {
    enrolled: number
    awaiting_match: number
    voucher_issued: number
    care_received: number
  } | null
  beneficiaries: AdminUserBeneficiary[]
  health_issues: AdminUserHealthIssue[]
  receptionist_stats: {
    redeemed_vouchers: number
    total_medical_claims: number
    pending_claims: number
    approved_claims: number
    rejected_claims: number
    uploaded_proofs: number
  } | null
  submitted_claims: AdminUserClaim[]
  system_admin_stats: {
    enrolled_admins: number
    enrolled_social_workers: number
    validated_health_issues: number
    reviewed_claims: number
  } | null
}