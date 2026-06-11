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
