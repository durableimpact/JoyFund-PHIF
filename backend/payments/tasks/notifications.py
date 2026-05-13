"""
Celery tasks for donation and payment events.

Handles:
- Notifying donors when they make a donation
- Broadcasting donation events to website visitors
- Notifying admins of new donations
"""

import logging
from celery import shared_task
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from datetime import datetime

logger = logging.getLogger(__name__)

channel_layer = get_channel_layer()


@shared_task(bind=True, max_retries=3)
def notify_donation_made(self, donation_id: int, donor_id: int|None, campaign_id: int):
    """
    Notify relevant parties when a donation is successfully made.
    
    Broadcasts to:
    1. 'donations' group - Global donation feed (website visitors)
    2. 'donations_detail_{campaign_id}' - Campaign-specific feed
    3. 'admin_dashboard' - Admin dashboard
    4. Donor's personal notifications
    
    Creates Notification DB records for async fallback.
    
    Args:
        donation_id: ID of the donation
        donor_id: ID of the donor making the donation
        campaign_id: ID of the campaign receiving the donation
    """
    try:
        from django.contrib.auth import get_user_model
        from campaigns.models import Campaign, Donation
        from notifications.models import Notification
        
        User = get_user_model()
        
        # Verify donation and campaign exist
        try:
            donation = Donation.objects.select_related('campaign', 'donor').get(id=donation_id)
            campaign = donation.campaign
        except (Donation.DoesNotExist, Campaign.DoesNotExist):
            logger.error(f"Donation {donation_id} or campaign {campaign_id} not found")
            return
        
        # Prepare message data
        message_data = {
            'type': 'notification_event',
            'event': 'donation_created',
            'timestamp': donation.created_at.isoformat() if hasattr(donation, 'created_at') else datetime.now().isoformat(),
            'data': {
                'id': donation.id,
                'title': f'New Donation to {campaign.title}',
                'message': f'{donation.donor_name or "A donor"} donated {donation.net_amount} XAF to {campaign.title}',
                'object': {
                    'donation_id': donation.id,
                    'campaign_id': campaign.id,
                    'campaign_name': campaign.title,
                    'donor_id': donor_id,
                    'donor_name': donation.donor_name,
                    'amount': donation.net_amount,
                    'currency': "XAF",
                    'status': donation.status,
                }
            }
        }
        
        # Broadcast to global donations feed
        async def broadcast():
            # 1. Broadcast to global donations group
            await channel_layer.group_send('donations', message_data)
            logger.debug("Sent to 'donations' group")
            
            # 2. Broadcast to campaign-specific donations group
            campaign_group = f'donations_detail_{campaign_id}'
            await channel_layer.group_send(campaign_group, message_data)
            logger.debug(f"Sent to '{campaign_group}' group")
            
            # 3. Broadcast to admin dashboard
            await channel_layer.group_send('admin_dashboard', message_data)
            logger.debug("Sent to 'admin_dashboard' group")
            
            # 4. Send to donor's personal notification channel
            donor_channel = f'user_{donor_id}'
            donor_message = {**message_data, 'type': 'notification_event'}
            await channel_layer.group_send(donor_channel, donor_message)
            logger.debug(f"Sent to '{donor_channel}' group")
        
        async_to_sync(broadcast)()
        
        # Create database notification records for offline users
        try:
            # For admin users
            admin_users = User.objects.filter(role='SYSTEM_ADMIN')
            for admin in admin_users:
                Notification.objects.create(
                    user=admin,
                    title=message_data['data']['title'],
                    message=message_data['data']['message'],
                    notification_type='DONATION_RECEIVED',
                    description=f"Donation #{donation.id} for campaign '{campaign.title}'",
                )
            
            # For donor
            if donor_id:
                try:
                    donor_user = User.objects.get(id=donor_id)
                    Notification.objects.create(
                        user=donor_user,
                        title=f'Donation Confirmed',
                        message=f'Your donation of {donation.net_amount} XAF has been received',
                        notification_type='DONATION_SENT',
                    )
                except User.DoesNotExist:
                    pass
            
            
            logger.info(f"Created notification DB records for donation {donation_id}")
        except Exception as e:
            logger.warning(f"Failed to create notification records: {str(e)}")
        
        logger.info(f"Broadcasted donation_created event: {donation_id}")
        
    except Exception as exc:
        logger.error(f"Error in notify_donation_made: {str(exc)}", exc_info=True)
        raise self.retry(exc=exc, countdown=60 * (2 ** self.request.retries))
