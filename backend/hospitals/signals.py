from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.core.cache import cache

from hospitals.models import Hospital, Services, ClaimItem
from django.db.models import Sum


@receiver(post_save, sender=ClaimItem)
@receiver(post_delete, sender=ClaimItem)
def update_claim_total_cost(sender, instance, **kwargs):
    """
    Whenever a ClaimItem is created, updated, or deleted, recalculate the total cost of the associated MedicalClaim.
    This ensures that the MedicalClaim's total_cost field always reflects the sum of its ClaimItems.
    """
    claim = instance.medical_claim

    total = claim.claim_items.aggregate(total=Sum("amount"))["total"] or 0

    claim.total_cost = total
    claim.save(update_fields=["total_cost"])


@receiver(post_save, sender=Hospital)
def invalidate_hospital_caches_on_save(sender, instance, created, **kwargs):
    """Invalidate hospital caches when a hospital is created or updated"""
    # Always invalidate the list cache
    cache.delete("hospital_list")

    # Invalidate the detail cache for this hospital
    cache.delete(f"hospital_detail_{instance.id}")


@receiver(post_delete, sender=Hospital)
def invalidate_hospital_caches_on_delete(sender, instance, **kwargs):
    """Invalidate hospital caches when a hospital is deleted"""
    # Invalidate the list cache
    cache.delete("hospital_list")

    # Invalidate the detail cache for this hospital
    cache.delete(f"hospital_detail_{instance.id}")


@receiver(post_save, sender=Services)
def invalidate_service_caches_on_save(sender, instance, created, **kwargs):
    """Invalidate service caches when a service is created or updated"""
    # Invalidate the services list cache for this hospital
    cache.delete(f"service_list_hospital_{instance.hospital_id}")

    # Invalidate the service detail cache with hospital context
    cache.delete(f"service_detail_hospital_{instance.hospital_id}_{instance.id}")


@receiver(post_delete, sender=Services)
def invalidate_service_caches_on_delete(sender, instance, **kwargs):
    """Invalidate service caches when a service is deleted"""
    # Invalidate the services list cache for this hospital
    cache.delete(f"service_list_hospital_{instance.hospital_id}")

    # Invalidate the service detail cache with hospital context
    cache.delete(f"service_detail_hospital_{instance.hospital_id}_{instance.id}")
