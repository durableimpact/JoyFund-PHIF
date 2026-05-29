import logging
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.apps import apps
from core.cache import invalidate_group

logger = logging.getLogger(__name__)

# Map models to their cache groups.
# Format: {'app_label.ModelName': 'group_name'}
CACHE_GROUP_MAP = {
    'accounts.HospitalAdmin': 'hospital_admins',
    # Add other models here as needed:
    # 'accounts.User': 'users',
}

def get_group_for_model(sender):
    """Helper to find the cache group for a given model class."""
    model_name = f"{sender._meta.app_label}.{sender.__name__}"
    return CACHE_GROUP_MAP.get(model_name)

@receiver(post_save)
def invalidate_cache_on_save(sender, instance, **kwargs):
    """Invalidate cache group when an instance is saved (created/updated)."""
    group = get_group_for_model(sender)
    if group:
        logger.debug(f"Signal caught for {sender.__name__} save. Invalidating cache group: {group}")
        invalidate_group(group)

@receiver(post_delete)
def invalidate_cache_on_delete(sender, instance, **kwargs):
    """Invalidate cache group when an instance is deleted."""
    group = get_group_for_model(sender)
    if group:
        logger.debug(f"Signal caught for {sender.__name__} delete. Invalidating cache group: {group}")
        invalidate_group(group)
