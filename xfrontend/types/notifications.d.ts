// ── Notification ──

declare type NotificationType =
  | "WELCOME"
  | "SYSTEM"
  | "ANNOUNCEMENT"
  | "ALERT"
  | "CAMPAIGN_UPDATE"
  | "DONATION_RECEIVED"
  | "DONATION_SENT"
  | "BENEFICIARY_UPDATE"
  | "PAYMENT_NOTIFICATION"
  | "VERIFICATION_STATUS";

declare interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  description?: string | null;
  notification_type: NotificationType;
  is_read: boolean;
  action_url?: string | null;
  created_at: string;
  updated_at: string;
}

declare interface NotificationsByType {
  type: NotificationType;
  count: number;
}

declare interface UnreadCountResponse {
  count: number;
}
