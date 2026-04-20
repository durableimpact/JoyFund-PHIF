from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.core.cache import cache

from hospitals.models import Hospital, Services
from payments.models import HospitalAccount


@receiver(post_save, sender=Hospital)
def create_hospital_account(sender, instance, created, **kwargs):
    """
    Automatically create a HospitalAccount when a Hospital is created.
    
    The account serves as the ledger for the hospital's balance.
    Funds are moved here from the EscrowAccount when vouchers are completed.
    """
    if created:
        HospitalAccount.objects.get_or_create(
            hospital=instance,
            defaults={
                'name': f'{instance.name} Account',
                'balance': 0,
            }
        )


@receiver(post_save, sender=Hospital)
def invalidate_hospital_caches_on_save(sender, instance, created, **kwargs):
    """Invalidate hospital caches when a hospital is created or updated"""
    # Always invalidate the list cache
    cache.delete('hospital_list')
    
    # Invalidate the detail cache for this hospital
    cache.delete(f'hospital_detail_{instance.id}')


@receiver(post_delete, sender=Hospital)
def invalidate_hospital_caches_on_delete(sender, instance, **kwargs):
    """Invalidate hospital caches when a hospital is deleted"""
    # Invalidate the list cache
    cache.delete('hospital_list')
    
    # Invalidate the detail cache for this hospital
    cache.delete(f'hospital_detail_{instance.id}')


@receiver(post_save, sender=Services)
def invalidate_service_caches_on_save(sender, instance, created, **kwargs):
    """Invalidate service caches when a service is created or updated"""
    # Invalidate the services list cache for this hospital
    cache.delete(f'service_list_hospital_{instance.hospital_id}')
    
    # Invalidate the service detail cache with hospital context
    cache.delete(f'service_detail_hospital_{instance.hospital_id}_{instance.id}')


@receiver(post_delete, sender=Services)
def invalidate_service_caches_on_delete(sender, instance, **kwargs):
    """Invalidate service caches when a service is deleted"""
    # Invalidate the services list cache for this hospital
    cache.delete(f'service_list_hospital_{instance.hospital_id}')
    
    # Invalidate the service detail cache with hospital context
    cache.delete(f'service_detail_hospital_{instance.hospital_id}_{instance.id}')
