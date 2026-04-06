"""
Standardized message format helpers for WebSocket events.

Provides consistent JSON message structure for all real-time events
sent through WebSocket consumers and Celery broadcast tasks.

All messages follow this schema:
{
  "type": "notification_event",
  "event": "user_created|donation_created|voucher_created|voucher_redeemed",
  "timestamp": "ISO8601",
  "data": {
    "id": "object_id",
    "title": "Human readable title",
    "message": "Human readable message",
    "notification_id": "database notification record id",
    "object": {... event-specific object data ...}
  }
}
"""

from datetime import datetime
from typing import Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)


class MessageBuilder:
    """Base class for building standardized WebSocket messages."""
    
    @staticmethod
    def build_event_message(
        event_type: str,
        event_title: str,
        event_message: str,
        object_data: Dict[str, Any],
        notification_id: Optional[int] = None,
        timestamp: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Build a standardized event message for WebSocket broadcast.
        
        Args:
            event_type: Event type identifier (user_created, donation_created, etc.)
            event_title: Human-readable title for the event
            event_message: Human-readable message for the event
            object_data: Dictionary containing event-specific object data
            notification_id: Optional ID of database notification record
            timestamp: Optional ISO8601 timestamp (defaults to now)
            
        Returns:
            Standardized message dictionary ready for WebSocket broadcast
        """
        if timestamp is None:
            timestamp = datetime.now().isoformat()
        
        return {
            'type': 'notification_event',
            'event': event_type,
            'timestamp': timestamp,
            'data': {
                'id': object_data.get('id', ''),
                'title': event_title,
                'message': event_message,
                'notification_id': notification_id,
                'object': object_data,
            }
        }


class UserCreatedMessage(MessageBuilder):
    """Format for user_created events."""
    
    @staticmethod
    def build(
        user_id: int,
        email: str,
        full_name: str,
        role: str,
        created_at: Optional[str] = None,
        notification_id: Optional[int] = None,
        timestamp: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Build a user_created event message.
        
        Args:
            user_id: ID of the created user
            email: User email address
            full_name: Full name of user
            role: User role (DONOR, HOSPITAL_ADMIN, etc.)
            created_at: ISO8601 timestamp of user creation
            notification_id: Database notification record ID
            timestamp: When the event was fired
            
        Returns:
            Standardized user_created message
        """
        object_data = {
            'user_id': user_id,
            'email': email,
            'full_name': full_name,
            'role': role,
            'created_at': created_at,
        }
        
        return MessageBuilder.build_event_message(
            event_type='user_created',
            event_title=f'New {role} Account Created',
            event_message=f'{full_name} ({email}) has created an account.',
            object_data=object_data,
            notification_id=notification_id,
            timestamp=timestamp,
        )


class DonationCreatedMessage(MessageBuilder):
    """Format for donation_created events."""
    
    @staticmethod
    def build(
        donation_id: int,
        campaign_id: int,
        campaign_name: str,
        donor_id: int,
        donor_name: str,
        amount: str,
        currency: str = 'XAF',
        notification_id: Optional[int] = None,
        timestamp: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Build a donation_created event message.
        
        Args:
            donation_id: ID of the donation
            campaign_id: ID of the receiving campaign
            campaign_name: Name of the campaign
            donor_id: ID of the donor
            donor_name: Name of the donor
            amount: Donation amount
            currency: Currency code (default: XAF)
            notification_id: Database notification record ID
            timestamp: When the event was fired
            
        Returns:
            Standardized donation_created message
        """
        object_data = {
            'donation_id': donation_id,
            'campaign_id': campaign_id,
            'campaign_name': campaign_name,
            'donor_id': donor_id,
            'donor_name': donor_name,
            'amount': amount,
            'currency': currency,
        }
        
        return MessageBuilder.build_event_message(
            event_type='donation_created',
            event_title=f'New Donation to {campaign_name}',
            event_message=f'{donor_name} donated {amount} {currency} to {campaign_name}',
            object_data=object_data,
            notification_id=notification_id,
            timestamp=timestamp,
        )


class VoucherCreatedMessage(MessageBuilder):
    """Format for voucher_created events."""
    
    @staticmethod
    def build(
        voucher_id: int,
        voucher_code: str,
        beneficiary_name: str,
        campaign_id: int,
        campaign_name: str,
        hospital_id: int,
        hospital_name: Optional[str] = None,
        urgency_level: Optional[str] = None,
        notification_id: Optional[int] = None,
        timestamp: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Build a voucher_created event message.
        
        Args:
            voucher_id: ID of the voucher
            voucher_code: Unique voucher code
            beneficiary_name: Name of the beneficiary
            campaign_id: ID of the campaign
            campaign_name: Name of the campaign
            hospital_id: ID of the hospital
            hospital_name: Name of the hospital
            urgency_level: Beneficiary urgency level
            notification_id: Database notification record ID
            timestamp: When the event was fired
            
        Returns:
            Standardized voucher_created message
        """
        object_data = {
            'voucher_id': voucher_id,
            'voucher_code': voucher_code,
            'beneficiary_name': beneficiary_name,
            'campaign_id': campaign_id,
            'campaign_name': campaign_name,
            'hospital_id': hospital_id,
            'hospital_name': hospital_name,
            'urgency_level': urgency_level,
        }
        
        return MessageBuilder.build_event_message(
            event_type='voucher_created',
            event_title='New Care Voucher Created',
            event_message=f'Voucher {voucher_code} for {beneficiary_name} has been issued.',
            object_data=object_data,
            notification_id=notification_id,
            timestamp=timestamp,
        )


class VoucherRedeemedMessage(MessageBuilder):
    """Format for voucher_redeemed events."""
    
    @staticmethod
    def build(
        voucher_id: int,
        voucher_code: str,
        beneficiary_name: str,
        campaign_id: int,
        campaign_name: str,
        hospital_id: int,
        hospital_name: str,
        notification_id: Optional[int] = None,
        timestamp: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Build a voucher_redeemed event message.
        
        Args:
            voucher_id: ID of the voucher
            voucher_code: Unique voucher code
            beneficiary_name: Name of the beneficiary
            campaign_id: ID of the campaign
            campaign_name: Name of the campaign
            hospital_id: ID of the hospital
            hospital_name: Name of the hospital
            notification_id: Database notification record ID
            timestamp: When the event was fired
            
        Returns:
            Standardized voucher_redeemed message
        """
        object_data = {
            'voucher_id': voucher_id,
            'voucher_code': voucher_code,
            'beneficiary_name': beneficiary_name,
            'campaign_id': campaign_id,
            'campaign_name': campaign_name,
            'hospital_id': hospital_id,
            'hospital_name': hospital_name,
        }
        
        return MessageBuilder.build_event_message(
            event_type='voucher_redeemed',
            event_title='Your Contribution Was Used',
            event_message=f'A care voucher for {beneficiary_name} has been redeemed at {hospital_name}.',
            object_data=object_data,
            notification_id=notification_id,
            timestamp=timestamp,
        )


class VoucherAssignmentPendingMessage(MessageBuilder):
    """Format for voucher_assignment_pending events."""
    
    @staticmethod
    def build(
        assignment_id: int,
        beneficiary_name: str,
        matched_amount: str,
        campaign_name: str,
        hospital_name: str,
        approval_deadline: str,
        notification_id: Optional[int] = None,
        timestamp: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Build a voucher_assignment_pending event message.
        
        Sent to system admins when a beneficiary is matched with funds
        and requires approval within 24 hours.
        
        Args:
            assignment_id: ID of the VoucherAssignment
            beneficiary_name: Name of the beneficiary
            matched_amount: Amount matched (as string)
            campaign_name: Name of the campaign funding this
            hospital_name: Name of the hospital providing service
            approval_deadline: ISO8601 timestamp of approval deadline
            notification_id: Database notification record ID
            timestamp: When the event was fired
            
        Returns:
            Standardized voucher_assignment_pending message
        """
        object_data = {
            'assignment_id': assignment_id,
            'beneficiary_name': beneficiary_name,
            'matched_amount': matched_amount,
            'campaign_name': campaign_name,
            'hospital_name': hospital_name,
            'approval_deadline': approval_deadline,
        }
        
        return MessageBuilder.build_event_message(
            event_type='voucher_assignment_pending',
            event_title='Voucher Assignment Requires Approval',
            event_message=f'Voucher for {beneficiary_name} ({matched_amount}) awaits your approval by {approval_deadline}',
            object_data=object_data,
            notification_id=notification_id,
            timestamp=timestamp,
        )


# Alias for backward compatibility with tasks
class NotificationMessage(MessageBuilder):
    """Generic notification message (for compatibility)."""
    
    @staticmethod
    def build(
        notification_type: str,
        title: str,
        message: str,
        object_data: Dict[str, Any],
        notification_id: Optional[int] = None,
        timestamp: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Build a generic notification message.
        
        Args:
            notification_type: Type of notification
            title: Title of notification
            message: Message text
            object_data: Object-specific data
            notification_id: Database notification record ID
            timestamp: When the event was fired
            
        Returns:
            Standardized notification message
        """
        return MessageBuilder.build_event_message(
            event_type=notification_type,
            event_title=title,
            event_message=message,
            object_data=object_data,
            notification_id=notification_id,
            timestamp=timestamp,
        )
