"""
WebSocket message definitions using Chanx BaseMessage for type safety and validation.

All WebSocket messages follow Chanx pattern where:
- Each message has an 'action' field (Literal) for routing
- Each message has a 'payload' field for data
- Incoming messages: Client → Server
- Outgoing messages: Server → Client  
- Event messages: HTTP endpoints → Consumer groups
"""

from typing import Literal, Optional
from pydantic import BaseModel, Field
from chanx.messages.base import BaseMessage
from datetime import datetime


# ============================================================================
# Payload Models (Data containers)
# ============================================================================


class CampaignPayload(BaseModel):
    """Payload for campaign-related messages."""
    campaign_id: int = Field(..., description="Campaign ID")


class NotificationPayload(BaseModel):
    """Payload for notification operations."""
    notification_id: int = Field(..., description="Notification ID")


class ErrorPayload(BaseModel):
    """Payload for error responses."""
    error_code: str = "UNKNOWN_ERROR"
    message: str = "An error occurred"


# ============================================================================
# Incoming Messages (Client → Server)
# ============================================================================

class PingMessage(BaseMessage):
    """Client ping for connection health check."""
    action: Literal["ping"] = "ping"
    payload: None = None


class SubscribeCampaignMessage(BaseMessage):
    """Subscribe to campaign-specific donation feed."""
    action: Literal["subscribe_campaign"] = "subscribe_campaign"
    payload: CampaignPayload


class UnsubscribeCampaignMessage(BaseMessage):
    """Unsubscribe from campaign-specific donation feed."""
    action: Literal["unsubscribe_campaign"] = "unsubscribe_campaign"
    payload: CampaignPayload


class MarkAsReadMessage(BaseMessage):
    """Mark notification as read."""
    action: Literal["mark_as_read"] = "mark_as_read"
    payload: NotificationPayload


class MarkAllAsReadMessage(BaseMessage):
    """Mark all notifications as read."""
    action: Literal["mark_all_as_read"] = "mark_all_as_read"
    payload: None = None


class DeleteNotificationMessage(BaseMessage):
    """Delete a notification."""
    action: Literal["delete_notification"] = "delete_notification"
    payload: NotificationPayload



# ============================================================================
# Outgoing Messages (Server → Client / Broadcast Events)
# ============================================================================

class PongMessage(BaseMessage):
    """Server pong response."""
    action: Literal["pong"] = "pong"
    payload: None = None


class SubscribedMessage(BaseMessage):
    """Confirmation of subscription."""
    action: Literal["subscribed"] = "subscribed"
    payload: CampaignPayload


class UnsubscribedMessage(BaseMessage):
    """Confirmation of unsubscription."""
    action: Literal["unsubscribed"] = "unsubscribed"
    payload: CampaignPayload


class NotificationMarkedReadMessage(BaseMessage):
    """Notification marked as read."""
    action: Literal["notification_marked_read"] = "notification_marked_read"
    payload: NotificationPayload


class AllNotificationsMarkedReadMessage(BaseMessage):
    """All notifications marked as read."""
    action: Literal["all_notifications_marked_read"] = "all_notifications_marked_read"
    payload: None = None


class NotificationDeletedMessage(BaseMessage):
    """Notification deleted."""
    action: Literal["notification_deleted"] = "notification_deleted"
    payload: NotificationPayload


class ErrorMessage(BaseMessage):
    """Error response from server."""
    action: Literal["error"] = "error"
    payload: ErrorPayload = Field(default_factory=lambda: ErrorPayload())


# Event message payloads
class UserCreatedPayload(BaseModel):
    """Payload for user creation event."""
    user_id: int
    email: str
    full_name: str
    phone_number: Optional[str] = None
    user_type: str
    created_at: datetime


class UserCreatedMessage(BaseMessage):
    """Notifies admins when new user (donor) signs up."""
    action: Literal["user_created"] = "user_created"
    payload: UserCreatedPayload


class DonationPayload(BaseModel):
    """Payload for donation event."""
    donation_id: int
    campaign_id: int
    campaign_name: str
    donor_name: str
    amount: float
    currency: str = "XAF"
    status: str
    progress_percentage: float = Field(default=0.0, description="Campaign progress percentage (0-100)")
    created_at: datetime


class DonationCreatedMessage(BaseMessage):
    """Broadcasts when donation is successfully processed."""
    action: Literal["donation_created"] = "donation_created"
    payload: DonationPayload


class VoucherAssignmentPayload(BaseModel):
    """Payload for voucher assignment pending approval."""
    voucher_id: int
    beneficiary_name: str
    campaign_name: str
    hospital_name: str
    matched_amount: float
    created_at: datetime


class VoucherAssignmentPendingMessage(BaseMessage):
    """Notifies admins that voucher assignment requires approval within 24h."""
    action: Literal["voucher_assignment_pending"] = "voucher_assignment_pending"
    payload: VoucherAssignmentPayload


class VoucherPayload(BaseModel):
    """Payload for voucher creation/redemption events."""
    voucher_id: int
    voucher_code: str
    beneficiary_name: str
    campaign_id: int
    campaign_name: str
    hospital_id: int
    hospital_name: str = ""
    amount: float
    currency: str = "XAF"
    created_at: datetime


class VoucherCreatedMessage(BaseMessage):
    """Notifies hospital staff and admins when care voucher is issued."""
    action: Literal["voucher_created"] = "voucher_created"
    payload: VoucherPayload


class VoucherRedeemedMessage(BaseMessage):
    """Notifies donors when their contributed voucher is redeemed."""
    action: Literal["voucher_redeemed"] = "voucher_redeemed"
    payload: VoucherPayload


# ============================================================================
# Event Messages (HTTP/Celery → Consumer groups)
# ============================================================================

class UserCreatedEvent(BaseMessage):
    """Event: User created in system."""
    action: Literal["user_created"] = "user_created"
    payload: UserCreatedPayload


class DonationCreatedEvent(BaseMessage):
    """Event: Donation created in system."""
    action: Literal["donation_created"] = "donation_created"
    payload: DonationPayload


class VoucherAssignmentPendingEvent(BaseMessage):
    """Event: Voucher assignment pending."""
    action: Literal["voucher_assignment_pending"] = "voucher_assignment_pending"
    payload: VoucherAssignmentPayload


class VoucherCreatedEvent(BaseMessage):
    """Event: Voucher created in system."""
    action: Literal["voucher_created"] = "voucher_created"
    payload: VoucherPayload


class VoucherRedeemedEvent(BaseMessage):
    """Event: Voucher redeemed in system."""
    action: Literal["voucher_redeemed"] = "voucher_redeemed"
    payload: VoucherPayload
