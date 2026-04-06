"""
Signal handlers for automatic logging of Django/DRF events.
"""

from django.dispatch import receiver
from django.contrib.auth.signals import user_logged_in, user_logged_out
from django.db.models.signals import post_save, post_delete
from django.contrib.auth import get_user_model
from .services import LogService

User = get_user_model()


@receiver(user_logged_in)
def log_user_login(sender, request, user, **kwargs):
    """Log when a user logs in."""
    LogService.info(
        request,
        'user.login',
        user=user,
        description=f'User {user.get_full_name() or user.email} logged in',
        target=user,
    )


@receiver(user_logged_out)
def log_user_logout(sender, request, user, **kwargs):
    """Log when a user logs out."""
    LogService.info(
        request,
        'user.logout',
        user=user,
        description=f'User {user.get_full_name() or user.email} logged out',
        target=user,
    )


@receiver(post_save, sender=User)
def log_user_created(sender, instance, created, **kwargs):
    """Log when a new user is created."""
    if created:
        LogService.info(
            None,  # No request in registration signal context
            'user.registered',
            user=instance,
            description=f'New user registered: {instance.get_full_name() or instance.email} ({instance.email})',
            target=instance,
        )


@receiver(post_delete, sender=User)
def log_user_deleted(sender, instance, **kwargs):
    """Log when a user is deleted."""
    LogService.warning(
        None,
        'user.deleted',
        description=f'User deleted: {instance.get_full_name() or instance.email} ({instance.email})',
    )
