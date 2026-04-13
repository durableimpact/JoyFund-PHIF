from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.core.cache import cache

from campaigns.models import Campaign, Donation


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
def invalidate_donation_caches_on_success(sender, instance, created, **kwargs):
    """Invalidate donation caches only when a donation is successfully completed"""
    # Only invalidate if the donation status is SUCCESS
    if instance.payment.payment_status == 'SUCCESS':
        # Invalidate the donations list cache for this campaign
        cache.delete(f'donation_list_campaign_{instance.campaign_id}')
        # Invalidate the donation detail cache
        cache.delete(f'donation_detail_{instance.id}')
