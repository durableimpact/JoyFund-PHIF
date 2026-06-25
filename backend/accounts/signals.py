"""
Django signals for the accounts app.
Handles events like user creation, updates, etc.
"""
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.template.loader import render_to_string
from django.conf import settings
import logging

from accounts.models import User
from accounts.models import Donor, HospitalAdmin, Receptionist, SocialWorker, SystemAdmin, Role
from accounts.tasks.send_mail import send_async_email
from accounts.tasks import notify_admin_user_created

logger = logging.getLogger(__name__)


@receiver(post_save,sender=User)
def create_system_admin_profile_after_user_account_created(sender,instance,created,**kwargs):
    """
    Create a system admin profile after a user with role of SYSTEM_ADMIN created
    """
    if created and instance.role == Role.SYSTEM_ADMIN:
        profile, created_profile = SystemAdmin.objects.get_or_create(user=instance)
        if created_profile:
            logger.info(f"SystemAdmin profile created for user {instance.id} ({instance.email})")
        else:
            logger.warning(f"SystemAdmin profile already existed for user {instance.id}")


@receiver(post_save, sender=User, dispatch_uid='send_welcome_email_on_user_create')
def send_welcome_email_on_user_creation(sender, instance, created, **kwargs):
    """
    Signal handler that sends a welcome email when a new user is created.
    Also notifies admin dashboard for donor creations.
    
    This constructs the welcome email and triggers the async send_email task.
    Email construction happens here so different email types can be built as needed.
    The actual sending happens asynchronously in Celery, so it doesn't block user creation.
    If email sending fails, it will retry up to 3 times before giving up silently.
    
    For donor and patient user creation, also triggers a WebSocket notification
    to the admin dashboard so they're aware of new account signups in real-time.
    
    Args:
        sender: The model class (User)
        instance: The user instance
        created (bool): True if this is a new user creation
        **kwargs: Additional signal arguments
    """
    if created:
        # Construct welcome email
        subject = 'Welcome to JoyFund!'
        
        context = {
            'first_name': instance.first_name,
            'user_email': instance.email,
            'app_name': 'JoyFund',
            'login_url': getattr(settings, 'FRONTEND_URL', 'https://joy-fund.com'),
        }
        
        user_role = getattr(instance, 'role', None)
        
        if user_role == 'DONOR':
            logger.info(f"Donor user {instance.id} ({instance.email}) created — verification email deferred to user request")
        elif user_role in ('SOCIAL_WORKER', 'RECEPTIONIST', 'HOSPITAL_ADMIN'):
            # Credentials email is sent directly from the serializer's create() method
            # where the plaintext password is still available
            logger.info(f"Credentials email handled by serializer for {instance.id} ({instance.email}) with role {user_role}")
        else:
            # Render HTML email template
            html_message = render_to_string('emails/welcome.html', context)
            
            # Trigger async task - this returns immediately, doesn't block
            send_async_email.delay(
                subject=subject,
                recipient_email=instance.email,
                html_message=html_message,
            )
            logger.info(f"Welcome email queued for user {instance.id} ({instance.email}) with role {user_role}")
        
        # Notify admin dashboard for donor account creations
        # (as per requirements: only donors and patients, not staff/system admin)
        user_role = getattr(instance, 'role', None)
        if user_role == 'DONOR':
            try:
                notify_admin_user_created.delay(
                    user_id=instance.id,
                    user_data={
                        'email': instance.email,
                        'full_name': f"{instance.first_name} {instance.last_name}".strip(),
                        'role': user_role,
                    }
                )
                logger.info(f"Queued notification task for new donor user: {instance.id}")
            except Exception as e:
                logger.error(f"Failed to queue user creation notification: {str(e)}", exc_info=True)


@receiver(post_save, sender=User, dispatch_uid='invalidate_user_info_cache_on_user_update')
def invalidate_user_info_cache_on_user_update(sender, instance, created, **kwargs):
    """
    Signal handler that invalidates user info caches when a user is updated.
    Ensures that cached user info doesn't serve stale data.
    
    This invalidates the cache for whichever user type this user is (Donor, HospitalAdmin, etc.)
    so that the next request will fetch fresh data from the database.
    
    Args:
        sender: The model class (User)
        instance: The user instance
        created (bool): True if this is a new user (we don't need to invalidate on create)
        **kwargs: Additional signal arguments
    """
    if not created:  # Only invalidate on update, not on initial creation
        from django.core.cache import cache
        user_id = instance.id
        
        # Invalidate all possible user info caches for this user
        cache_keys = [
            f'donor_info_{user_id}',
            f'hospital_admin_info_{user_id}',
            f'receptionist_info_{user_id}',
            f'social_worker_info_{user_id}',
            f'system_admin_info_{user_id}',
        ]
        
        for cache_key in cache_keys:
            cache.delete(f"view_cache:{cache_key}")
            cache.delete(cache_key)
        
        logger.debug(f"Invalidated user info caches for user {user_id}")


# Profile-specific cache invalidation handlers

@receiver(post_save, sender=Donor, dispatch_uid='invalidate_donor_info_cache')
def invalidate_donor_info_cache(sender, instance, **kwargs):
    """Invalidate donor info cache when donor profile is updated"""
    from django.core.cache import cache
    user_id = instance.user.id
    cache.delete(f'view_cache:donor_info:{user_id}')
    cache.delete(f'donor_info_{user_id}')
    logger.debug(f"Invalidated donor info cache for user {user_id}")


@receiver(post_save, sender=HospitalAdmin, dispatch_uid='invalidate_hospital_admin_info_cache')
def invalidate_hospital_admin_info_cache(sender, instance, **kwargs):
    """Invalidate hospital admin info cache when hospital admin profile is updated"""
    from django.core.cache import cache
    user_id = instance.user.id
    cache.delete(f'view_cache:hospital_admin_info:{user_id}')
    cache.delete(f'hospital_admin_info_{user_id}')
    logger.debug(f"Invalidated hospital admin info cache for user {user_id}")


@receiver(post_save, sender=Receptionist, dispatch_uid='invalidate_receptionist_info_cache')
def invalidate_receptionist_info_cache(sender, instance, **kwargs):
    """Invalidate receptionist info cache when receptionist profile is updated"""
    from django.core.cache import cache
    user_id = instance.user.id
    cache.delete(f'view_cache:receptionist_info:{user_id}')
    cache.delete(f'receptionist_info_{user_id}')
    logger.debug(f"Invalidated receptionist info cache for user {user_id}")


@receiver(post_save, sender=SocialWorker, dispatch_uid='invalidate_social_worker_info_cache')
def invalidate_social_worker_info_cache(sender, instance, **kwargs):
    """Invalidate social worker info cache when social worker profile is updated"""
    from django.core.cache import cache
    user_id = instance.user.id
    cache.delete(f'view_cache:social_worker_info:{user_id}')
    cache.delete(f'social_worker_info_{user_id}')
    logger.debug(f"Invalidated social worker info cache for user {user_id}")


@receiver(post_save, sender=SystemAdmin, dispatch_uid='invalidate_system_admin_info_cache')
def invalidate_system_admin_info_cache(sender, instance, **kwargs):
    """Invalidate system admin info cache when system admin profile is updated"""
    from django.core.cache import cache
    user_id = instance.user.id
    cache.delete(f'view_cache:system_admin_info:{user_id}')
    cache.delete(f'system_admin_info_{user_id}')
    logger.debug(f"Invalidated system admin info cache for user {user_id}")
