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
  total_users: number;
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
