"""
WebSocket consumers for real-time notifications using Chanx framework.

Follows the official Chanx Django example patterns:
- @channel decorator for consumer definition
- DjangoAuthenticator for authentication
- post_authentication() hook for group joining
- @event_handler for HTTP-triggered events
- @ws_handler for client-initiated messages
- broadcast_event_sync() from Celery tasks or HTTP views
"""

from chanx.channels.websocket import AsyncJsonWebsocketConsumer
from chanx.channels.authenticator import DjangoAuthenticator
from chanx.core.decorators import channel, event_handler, ws_handler
from channels.db import database_sync_to_async
from channels.layers import get_channel_layer
from typing import Optional
import logging

logger = logging.getLogger(__name__)

from backend.ws_messages import (
    # Incoming messages
    PingMessage, SubscribeCampaignMessage, UnsubscribeCampaignMessage,
    MarkAsReadMessage, MarkAllAsReadMessage, DeleteNotificationMessage,
    # Outgoing messages  
    PongMessage, SubscribedMessage, UnsubscribedMessage,
    NotificationMarkedReadMessage, AllNotificationsMarkedReadMessage,
    NotificationDeletedMessage, ErrorMessage,
    UserCreatedMessage, DonationCreatedMessage, VoucherAssignmentPendingMessage,
    VoucherCreatedMessage, VoucherRedeemedMessage,
    # Event messages (from HTTP/Celery)
    UserCreatedEvent, DonationCreatedEvent, VoucherAssignmentPendingEvent,
    VoucherCreatedEvent, VoucherRedeemedEvent,
)


# ============================================================================
# Donation Consumer (Unauthenticated)
# ============================================================================

@channel(
    name="donations",
    description="Real-time donation feed for website visitors",
    tags=["donations", "public"]
)
class DonationConsumer(AsyncJsonWebsocketConsumer):
    """
    Unauthenticated WebSocket consumer for donation events.
    
    Broadcasts:
    - Global donation feed (all donations across campaigns)
    - Per-campaign donation feeds
    
    Groups:
    - 'donations': Global feed
    - 'donations_detail_{campaign_id}': Campaign-specific
    """
    
    async def connect(self) -> None:
        """Accept connection and subscribe to global donations."""
        await self.accept()
        
        # Always join global donations group
        await self.channel_layer.group_add('donations', self.channel_name)
        self.groups = ['donations']
        
        logger.info(f"DonationConsumer: Client connected from {self.scope.get('client')}")
    
    async def disconnect(self, close_code: int) -> None:
        """Cleanup on disconnect."""
        logger.info(f"DonationConsumer: Client disconnected (code={close_code})")
    
    @ws_handler(
        summary='Subscribe to campaign donations',
        description='Subscribe to real-time donation updates for a specific campaign'
    )
    async def handle_subscribe_campaign(
        self, message: SubscribeCampaignMessage
    ) -> SubscribedMessage:
        """Subscribe to campaign-specific donation feed."""
        group_name = f'donations_detail_{message.payload.campaign_id}'
        await self.channel_layer.group_add(group_name, self.channel_name)
        self.groups.append(group_name)
        
        logger.info(f"DonationConsumer: Subscribed to campaign {message.payload.campaign_id}")
        return SubscribedMessage(payload=message.payload)
    
    @ws_handler(
        summary='Unsubscribe from campaign donations',
        description='Unsubscribe from campaign-specific donation updates'
    )
    async def handle_unsubscribe_campaign(
        self, message: UnsubscribeCampaignMessage
    ) -> UnsubscribedMessage:
        """Unsubscribe from campaign-specific donations."""
        group_name = f'donations_detail_{message.payload.campaign_id}'
        await self.channel_layer.group_discard(group_name, self.channel_name)
        if group_name in self.groups:
            self.groups.remove(group_name)
        
        logger.info(f"DonationConsumer: Unsubscribed from campaign {message.payload.campaign_id}")
        return UnsubscribedMessage(payload=message.payload)
    
    # Event handlers for HTTP-triggered broadcasts
    @event_handler
    async def handle_donation_created(
        self, event: DonationCreatedEvent
    ) -> DonationCreatedMessage:
        """Handle donation_created event broadcast from HTTP."""
        return DonationCreatedMessage(payload=event.payload)
    
    async def donation_event(self, event: dict) -> None:
        """
        Generic event handler for channel_layer messages.
        Called when message type is 'donation_event'.
        """
        await self.send_json(event)


# ============================================================================
# Notification Consumer (Authenticated)
# ============================================================================

class NotificationAuthenticator(DjangoAuthenticator):
    """Custom authenticator for notification consumer using OAuth2 access tokens."""
    queryset = None  # No specific object auth needed
    
    async def authenticate(self) -> bool:
        """Authenticate user from OAuth2 access token (drf-social-oauth2)."""
        from backend.auth import extract_token_from_scope, get_user_from_oauth2_token
        
        token = await extract_token_from_scope(self.scope)
        if not token:
            return False
        
        user = await get_user_from_oauth2_token(token)
        if not user:
            return False
        
        self.user = user
        return True


@channel(
    name="notifications",
    description="Real-time notifications for authenticated users",
    tags=["notifications", "authenticated"]
)
class NotificationConsumer(AsyncJsonWebsocketConsumer):
    """
    Authenticated WebSocket consumer for user notifications.
    
    Handles:
    - Personal user notifications
    - Role-based group notifications (admin, hospital staff)
    - Notification management (mark as read, delete)
    
    Groups:
    - 'user_{user_id}': Personal notifications
    - 'admin_dashboard': Admin/system notifications
    - 'hospital_{hospital_id}_staff': Hospital-specific
    """
    
    authenticator_class = NotificationAuthenticator
    authenticator: NotificationAuthenticator
    
    async def post_authentication(self) -> None:
        """Subscribe user to their groups after authentication."""
        user = self.authenticator.user
        
        # Always join personal notification group
        personal_group = f'user_{user.id}'
        await self.channel_layer.group_add(personal_group, self.channel_name)
        self.groups = [personal_group]
        
        # Admin subscriptions
        from backend.auth import is_admin
        if is_admin(user):
            await self.channel_layer.group_add('admin_dashboard', self.channel_name)
            self.groups.append('admin_dashboard')
        
        # Hospital staff subscriptions
        if hasattr(user, 'role') and user.role in ['HOSPITAL_ADMIN', 'RECEPTIONIST']:
            hospital_id = await self._get_hospital_id(user)
            if hospital_id:
                hospital_group = f'hospital_{hospital_id}_staff'
                await self.channel_layer.group_add(hospital_group, self.channel_name)
                self.groups.append(hospital_group)
        
        # Sync offline notifications
        await self._sync_unread_notifications(user)
        
        logger.info(f"NotificationConsumer: User {user.id} authenticated, groups={self.groups}")
    
    async def disconnect(self, close_code: int) -> None:
        """Cleanup on disconnect."""
        logger.info(f"NotificationConsumer: Disconnected (code={close_code})")
    
    @ws_handler(
        summary='Health check ping',
        description='Client sends ping, server responds with pong'
    )
    async def handle_ping(self, message: PingMessage) -> PongMessage:
        """Respond to ping."""
        return PongMessage()
    
    @ws_handler(
        summary='Mark notification as read',
        description='Mark a specific notification as read'
    )
    async def handle_mark_as_read(
        self, message: MarkAsReadMessage
    ) -> NotificationMarkedReadMessage:
        """Mark notification as read."""
        user = self.authenticator.user
        await self._mark_notification_read(message.payload.notification_id, user)
        return NotificationMarkedReadMessage(payload=message.payload)
    
    @ws_handler(
        summary='Mark all notifications as read',
        description='Mark all user notifications as read'
    )
    async def handle_mark_all_as_read(
        self, message: MarkAllAsReadMessage
    ) -> AllNotificationsMarkedReadMessage:
        """Mark all notifications as read."""
        user = self.authenticator.user
        await self._mark_all_notifications_read(user)
        return AllNotificationsMarkedReadMessage()
    
    @ws_handler(
        summary='Delete notification',
        description='Delete a notification'
    )
    async def handle_delete_notification(
        self, message: DeleteNotificationMessage
    ) -> NotificationDeletedMessage:
        """Delete a notification."""
        user = self.authenticator.user
        await self._delete_notification(message.payload.notification_id, user)
        return NotificationDeletedMessage(payload=message.payload)
    
    # Event handlers for HTTP-triggered broadcasts
    @event_handler
    async def handle_user_created(
        self, event: UserCreatedEvent
    ) -> UserCreatedMessage:
        """Handle user_created event from HTTP."""
        return UserCreatedMessage(payload=event.payload)
    
    @event_handler
    async def handle_donation_created(
        self, event: DonationCreatedEvent
    ) -> DonationCreatedMessage:
        """Handle donation_created event from HTTP."""
        return DonationCreatedMessage(payload=event.payload)
    
    @event_handler
    async def handle_voucher_assignment_pending(
        self, event: VoucherAssignmentPendingEvent
    ) -> VoucherAssignmentPendingMessage:
        """Handle voucher_assignment_pending event from HTTP."""
        return VoucherAssignmentPendingMessage(payload=event.payload)
    
    @event_handler
    async def handle_voucher_created(
        self, event: VoucherCreatedEvent
    ) -> VoucherCreatedMessage:
        """Handle voucher_created event from HTTP."""
        return VoucherCreatedMessage(payload=event.payload)
    
    @event_handler
    async def handle_voucher_redeemed(
        self, event: VoucherRedeemedEvent
    ) -> VoucherRedeemedMessage:
        """Handle voucher_redeemed event from HTTP."""
        return VoucherRedeemedMessage(payload=event.payload)
    
    async def notification_event(self, event: dict) -> None:
        """
        Generic event handler for channel_layer messages.
        Called when message type is 'notification_event'.
        """
        await self.send_json(event)
    
    # Database operations
    @database_sync_to_async
    def _get_hospital_id(self, user) -> Optional[int]:
        """Get hospital ID for hospital staff user."""
        from accounts.models import HospitalAdmin, Receptionist
        
        role = getattr(user, 'role', None)
        
        if role == 'HOSPITAL_ADMIN':
            try:
                admin = HospitalAdmin.objects.get(user=user)
                return admin.hospital_id
            except HospitalAdmin.DoesNotExist:
                return None
        
        elif role == 'RECEPTIONIST':
            try:
                receptionist = Receptionist.objects.get(user=user)
                return receptionist.hospital_id
            except Receptionist.DoesNotExist:
                return None
        
        return None
    
    @database_sync_to_async
    def _sync_unread_notifications(self, user):
        """Sync unread notifications from database."""
        from notifications.models import Notification
        
        count = Notification.objects.filter(user=user, is_read=False).count()
        logger.info(f"NotificationConsumer: Synced {count} unread for user {user.id}")
    
    @database_sync_to_async
    def _mark_notification_read(self, notification_id: int, user):
        """Mark a notification as read."""
        from notifications.models import Notification
        
        try:
            notification = Notification.objects.get(id=notification_id, user=user)
            notification.is_read = True
            notification.save()
        except Notification.DoesNotExist:
            logger.warning(f"Notification {notification_id} not found")
    
    @database_sync_to_async
    def _mark_all_notifications_read(self, user):
        """Mark all notifications as read."""
        from notifications.models import Notification
        
        count = Notification.objects.filter(user=user, is_read=False).update(is_read=True)
        logger.info(f"Marked {count} notifications as read for user {user.id}")
    
    @database_sync_to_async
    def _delete_notification(self, notification_id: int, user):
        """Delete a notification."""
        from notifications.models import Notification
        
        try:
            notification = Notification.objects.get(id=notification_id, user=user)
            notification.delete()
        except Notification.DoesNotExist:
            logger.warning(f"Notification {notification_id} not found")

@channel(
    name="pulse_dashboard",
    description='Live Layer 1 "Pulse" and Layer 2 "Proof" global feed',
    tags=["pulse", "public"]
)
class PulseConsumer(AsyncJsonWebsocketConsumer):
    """
    Handles Layer 1: "The Pulse" (Public Stats) & Layer 2: "The Proof"
    This is an open/unauthenticated consumer that streams live global
    donations and impacts to anyone viewing the homepage.
    """
    
    async def connect(self) -> None:
        """Accepts public dashboard connections directly."""
        await self.accept()
        # Add to the global pulse broadcast group
        await self.channel_layer.group_add("global_pulse", self.channel_name)
        logger.info(f"New client connected to public Pulse Dashboard: {self.channel_name}")

    async def disconnect(self, close_code: int) -> None:
        """Removes from the global pulse group."""
        await self.channel_layer.group_discard("global_pulse", self.channel_name)
        logger.info(f"Client disconnected from Pulse Dashboard: {self.channel_name}")

    @event_handler
    async def handle_pulse_donation(self, message: DonationCreatedMessage) -> None:
        """
        Broadcasts new donations live on the "Proof" (Layer 2 feed).
        Adds to the 'Total Joy Pooled' counter.
        """
        payload = message.payload.dict()
        await self.send_json({
            "action": "pulse_donation",
            "data": payload
        })

    @event_handler
    async def handle_pulse_redemption(self, message: VoucherRedeemedMessage) -> None:
        """
        Broadcasts live impacts on the "Proof" (Layer 2 feed).
        Increments 'Lives Impacted' counter.
        """
        payload = message.payload.dict()
        await self.send_json({
            "action": "pulse_redemption",
            "data": payload
        })
