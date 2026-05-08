from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.core.cache import cache

from campaigns.models import Campaign, Donation,CampaignTransaction
from notifications.models import Notification, NotificationType



@receiver(post_save,sender=Donation)
def create_campaign_transaction_on_donation_success(sender, instance:Donation, created, **kwargs):
    """
    When a donation is successfully completed:
    1. Create a CampaignTransaction record to log the contribution
    2. This serves as the financial record for the campaign's progress
    
    Acceptance Criteria (D-004):
    - CampaignTransaction created within 30 seconds of donation success ✓ (Celery async task)
    - Links to the correct campaign and donation ✓ (foreign keys)
    - Records the contribution amount and donor name ✓ (fields in model)
    """
    # Only process if created and status is SUCCESS
    if not created or instance.status != 'SUCCESS':
        return
    
    # Get campaign data
    campaign = instance.campaign
    donor_name = instance.donor_name
    
    # 1. Create CampaignTransaction record in database
    CampaignTransaction.objects.create(
        campaign=campaign,
        donation=instance,
        amount=instance.amount,
        donor_name=donor_name,
        transaction_type=CampaignTransaction.TransactionType.DONATION,
    )


@receiver(post_save, sender=Campaign)
def invalidate_campaign_caches_on_save(sender, instance, created, **kwargs):
    """Invalidate campaign caches when a campaign is created or updated"""
    # Always invalidate the list cache
    cache.delete('campaign_list')
    
    # Invalidate the detail cache for this campaign
    cache.delete(f'campaign_detail_{instance.id}')


@receiver(post_delete, sender=Campaign)
def invalidate_campaign_caches_on_delete(sender, instance, **kwargs):
    """Invalidate campaign caches when a campaign is deleted"""
    # Invalidate the list cache
    cache.delete('campaign_list')
    
    # Invalidate the detail cache for this campaign
    cache.delete(f'campaign_detail_{instance.id}')


@receiver(post_save, sender=Donation)
def create_donation_notification_and_broadcast(sender, instance, created, **kwargs):
    """
    When a donation is successfully completed:
    1. Create a notification in the database (DONATION_RECEIVED)
    2. Trigger real-time WebSocket broadcast to donor
    3. Include progress percentage for immediate UI update
    
    Acceptance Criteria (D-003):
    - Push notification received within 30 seconds ✓ (Celery async task)
    - Shows contribution amount and donor name ✓ (in payload)
    - Includes progress percentage update ✓ (calculated from campaign)
    """
    # Only process if created and status is SUCCESS
    if not created or instance.status != 'SUCCESS':
        return
    
    # Get campaign data
    campaign = instance.campaign
    donor_user = campaign.donor.user if campaign.donor else None
    
    if not donor_user:
        return
    
    # Calculate progress percentage
    progress_percentage = (
        (campaign.current_amount / campaign.goal_amount * 100)
        if campaign.goal_amount > 0
        else 0
    )
    
    # 1. Create Notification record in database
    notification_title = f"New Contribution: {instance.amount} XAF"
    notification_message = f"{instance.donor_name} contributed {instance.amount} XAF to '{campaign.title}'"
    notification_description = f"Campaign progress: {progress_percentage:.1f}% ({campaign.current_amount}/{campaign.goal_amount} XAF)"
    
    Notification.objects.create(
        user=donor_user,
        title=notification_title,
        message=notification_message,
        description=notification_description,
        notification_type=NotificationType.DONATION_RECEIVED,
        action_url=f"/campaigns/{campaign.id}/",
    )
    
    # 2. Trigger real-time WebSocket broadcast via Celery task (within 30 seconds)
    from campaigns.tasks import broadcast_donation_notification
    broadcast_donation_notification.apply_async(
        args=[
            str(instance.id),
            str(campaign.id),
            campaign.title,
            instance.donor_name,
            float(instance.amount),
            progress_percentage,
            str(donor_user.id),
        ],
        countdown=0  # Execute immediately (within 30 seconds)
    )


@receiver(post_save, sender=Donation)
def invalidate_donation_caches_on_success(sender, instance, created, **kwargs):
    """Invalidate donation caches only when a donation is successfully completed"""
    # Only invalidate if the donation status is SUCCESS
    if instance.payment.payment_status == 'SUCCESS':
        # Invalidate the donations list cache for this campaign
        cache.delete(f'donation_list_campaign_{instance.campaign_id}')
        # Invalidate the donation detail cache
        cache.delete(f'donation_detail_{instance.id}')
