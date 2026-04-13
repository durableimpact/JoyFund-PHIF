"""
Django signals for the notifications app.
"""
from django.core.cache import cache
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.template.loader import render_to_string
from django.conf import settings

from notifications.models import Notification
from accounts.tasks.send_mail import send_email


@receiver(post_save, sender=Notification, dispatch_uid='send_notification_email')
def send_notification_email(sender, instance, created, **kwargs):
    """
    Signal handler that sends an email when a new notification is created.
    
    This constructs the notification email and triggers the async send_email task.
    The actual sending happens asynchronously in Celery, so it doesn't block notification creation.
    If email sending fails, it will retry up to 3 times before giving up silently.
    
    Args:
        sender: The model class (Notification)
        instance: The notification instance
        created (bool): True if this is a new notification creation
        **kwargs: Additional signal arguments
    """
    if created:
        # Construct notification email
        subject = f'[{instance.get_notification_type_display()}] {instance.title}'
        
        context = {
            'user_name': instance.user.first_name,
            'notification_title': instance.title,
            'notification_message': instance.message,
            'notification_description': instance.description,
            'notification_type': instance.get_notification_type_display(),
            'action_url': instance.action_url,
            'app_name': 'JoyFund',
            'notification_id': str(instance.id),
        }
        
        # Render HTML email template
        html_message = render_to_string('emails/notification.html', context)
        
        # Trigger async task - this returns immediately, doesn't block
        send_email.delay(
            subject=subject,
            recipient_email=instance.user.email,
            html_message=html_message,
        )


@receiver(post_save, sender=Notification, dispatch_uid='invalidate_notification_caches')
def invalidate_notification_caches(sender, instance, created, **kwargs):
    """
    Signal handler that invalidates notification caches when a notification is created or updated.
    
    This ensures that:
    - New notifications trigger list cache invalidation for the user
    - Updated notifications (e.g., marked as read) invalidate list, detail, and unread count caches
    
    Args:
        sender: The model class (Notification)
        instance: The notification instance
        created (bool): True if this is a new notification creation
        **kwargs: Additional signal arguments
    """
    user_id = instance.user.id
    notification_id = instance.id
    
    # Invalidate the user's notification list cache
    cache.delete(f'notification_list_{user_id}')
    
    # Invalidate the notification detail cache
    cache.delete(f'notification_detail_{notification_id}')
    
    # Invalidate the user's unread count cache (always invalidate, as read status may have changed)
    cache.delete(f'notification_unread_count_{user_id}')
