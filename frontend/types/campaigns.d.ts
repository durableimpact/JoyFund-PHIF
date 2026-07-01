// ── Campaign ──

declare type CampaignEventType =
  | "BIRTHDAY"
  | "WEDDING"
  | "PROMOTION"
  | "GRADUATION"
  | "MEMORIAL";

declare type CampaignStatus =
  | "DRAFT"
  | "ACTIVE"
  | "INACTIVE"
  | "FUNDED"
  | "CLOSED"
  | "CANCELLED";

declare interface CampaignList {
  id: string;
  slug: string;
  title: string;
  description: string;
  cover_image?: string | null;
  goal: number;
  total_net_raised: number;
  progress_percentage: number;
  total_number_of_successfull_donations: number;
  certificate_generated: boolean;
  certificate_url: string | null;
}

declare interface Campaign {
  id: string;
  donor_id: string;
  title: string;
  slug: string;
  description: string;
  cover_image?: string | null;
  event_type: CampaignEventType;
  goal_amount: number;
  available_balance: number;
  total_net_raised: number;
  start_date: string;
  end_date: string;
  is_public: boolean;
  status: CampaignStatus;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  progress_percentage: number;
  certificate_generated: boolean;
  certificate_url: string | null;
  events?: CampaignEvent[];
  transactions?: CampaignTransaction[];
  voucher_fundings?: VoucherFundingDetail[];
}

declare interface CampaignDetail {
  id: string;
  donor: {
    id: string;
    user: {
      id: string;
      first_name: string;
      last_name: string;
      profile_picture: string | null;
    };
  };
  title: string;
  slug: string;
  description: string;
  cover_image?: string | null;
  event_type: CampaignEventType;
  goal_amount: number;
  available_balance: number;
  total_net_raised: number;
  start_date: string;
  end_date: string;
  is_public: boolean;
  status: CampaignStatus;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  progress_percentage: number;
  certificate_generated: boolean;
  certificate_url: string | null;
  location?: string;
  organizer_name?: string;
  donor_name?: string;
  donor_count?: number;
  events?: CampaignEvent[];
  transactions?: CampaignTransaction[];
  voucher_fundings?: VoucherFundingDetail[];
}

declare interface CampaignBalance {
  id: string;
  title: string;
  available_balance: number;
  status: CampaignStatus;
  is_active: boolean;
}

declare interface CampaignEvent {
  id: string;
  campaign_id: string;
  status: string;
  changed_by_id?: string | null;
  changed_at: string;
  notes?: string;
}

declare interface CampaignTransaction {
  id: string;
  transaction_type: CampaignTransactionType;
  voucher_funding_id?: string | null;
  amount: number;
  description: string;
  created_at: string;
}

declare type CampaignTransactionType =
  | "DONATION"
  | "VOUCHER_ALLOCATED"
  | "HOSPITAL_SETTLED"
  | "SURPLUS_REFUND"
  | "VOUCHER_EXPIRED_RETURN";

declare interface VoucherFundingDetail {
  id: string;
  voucher_id: string;
  amount: number;
  created_at: string;
  beneficiary_name?: string;
  hospital_name?: string;
  voucher_code?: string;
  status?: string;
  voucher?: {
    voucher_code?: string;
    status?: string;
    beneficiary?: {
      full_name?: string;
    };
    hospital?: {
      name?: string;
    };
  };
}

declare interface CampaignCreatePayload {
  title: string;
  description: string;
  cover_image?: File;
  event_type: CampaignEventType;
  goal_amount: number;
  end_date: string;
  is_public?: boolean;
  status?: CampaignStatus;
  is_active?: boolean;
}

declare interface CampaignUpdatePayload {
  title?: string;
  description?: string;
  cover_image?: File;
  event_type?: CampaignEventType;
  goal_amount?: number;
  end_date?: string;
  is_public?: boolean;
  status?: CampaignStatus;
  is_active?: boolean;
}

declare interface CampaignLeaderboardEntry {
  id: string;
  title: string;
  goal_amount: number;
  total_net_raised: number;
  progress_percentage: number;
  donor: {
    id: string;
    user: {
      id: string;
      first_name: string;
      last_name: string;
      profile_picture: string | null;
    };
  };
}

// ── Timeline ──

declare type TimelineItemType =
  | "donation"
  | "voucher-allocated"
  | "hospital-settled";

declare interface TimelineItem {
  id: string;
  type: TimelineItemType;
  amount: number;
  label: string;
  description: string | null;
  date: string;
}

// ── Donation Chart ──

declare type DonationChartPeriod = "7d" | "30d" | "90d" | "1y" | "all";

declare interface DonationChartPoint {
  date: string;
  total_amount: string;
  count: number;
}

declare interface DonationChartData {
  period: DonationChartPeriod;
  series: DonationChartPoint[];
  totals: {
    amount: string;
    count: number;
  };
}

// ── Donations ──

declare type DonationStatus = "PENDING" | "SUCCESS" | "FAILED";
declare type PaymentMethod = "MTN" | "ORANGE";
declare type PaymentStatus = "PENDING" | "SUCCESS" | "FAILED";

declare interface Donation {
  id: string;
  campaign_id: string;
  donor_id?: string | null;
  donor_name: string;
  amount: number;
  platform_fee_amount: number;
  net_amount: number;
  status: DonationStatus;
  message?: string;
  is_anonymous: boolean;
  created_at: string;
  updated_at: string;
  payment?: Payment;
  events?: DonationEvent[];
}

declare interface DonationEvent {
  id: string;
  donation_id: string;
  status: string;
  changed_by_id?: string | null;
  changed_at: string;
  notes?: string;
}

declare interface Payment {
  payment_id: string;
  payment_method: PaymentMethod;
  phone_number: string;
  amount: number;
  payment_status: PaymentStatus;
  payment_reference?: string | null;
  created_at: string;
  updated_at: string;
  events?: PaymentEvent[];
}

declare interface PaymentEvent {
  id: string;
  payment_id: string;
  status: string;
  changed_by_id?: string | null;
  changed_at: string;
  notes?: string;
}

declare interface DonationCreatePayload {
  donor_name?: string;
  amount: number;
  message?: string;
  is_anonymous?: boolean;
  payment_method: PaymentMethod;
  phone_number: string;
  success_url: string;
  failure_url: string;
}

// ── Campaign Analytics ──

declare type CampaignViewSource =
  | "push"
  | "social"
  | "google"
  | "email"
  | "direct"
  | "other";

declare type CampaignAnalyticsPeriod = "day" | "week" | "month";

declare interface CampaignSourceStats {
  total: number;
  unique: number;
}

declare interface CampaignTimelinePoint {
  period: string;
  total: number;
  unique: number;
  sources: Partial<Record<CampaignViewSource, CampaignSourceStats>>;
}

declare interface CampaignAnalytics {
  campaign_id: string;
  total_views: number;
  unique_views: number;
  sources: Partial<Record<CampaignViewSource, CampaignSourceStats>>;
  period: CampaignAnalyticsPeriod;
  start_date: string;
  end_date: string;
  timeline: CampaignTimelinePoint[];
}
