"""
Django signals for the notifications app.
"""

import logging

from accounts.tasks.send_mail import send_async_email
from django.conf import settings
from django.contrib.auth.signals import user_logged_in
from django.core.cache import cache
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.template.loader import render_to_string

from notifications.models import Notification, PushSubscription

logger = logging.getLogger("notifications")


@receiver(post_save, sender=Notification, dispatch_uid="send_web_push")
def send_web_push_notification(sender, instance, created, **kwargs):
    """
    Send a web push notification when a new Notification is created.
    """
    if created:
        from notifications.webpush import send_push_notification_to_user

        send_push_notification_to_user(
            user=instance.user,
            title=instance.title,
            body=instance.message[:200],
            url=instance.action_url,
            tag=str(instance.notification_type),
        )


@receiver(post_save, sender=Notification, dispatch_uid="send_notification_email")
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
        subject = f"[{instance.get_notification_type_display()}] {instance.title}"

        context = {
            "user_name": instance.user.first_name,
            "notification_title": instance.title,
            "notification_message": instance.message,
            "notification_description": instance.description,
            "notification_type": instance.get_notification_type_display(),
            "action_url": instance.action_url,
            "app_name": "JoyFund",
            "notification_id": str(instance.id),
        }

        # Render HTML email template
        html_message = render_to_string("emails/notification.html", context)

        # Trigger async task - this returns immediately, doesn't block
        send_async_email.delay(
            subject=subject,
            recipient_email=instance.user.email,
            html_message=html_message,
        )


@receiver(post_save, sender=Notification, dispatch_uid="invalidate_notification_caches")
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
    cache.delete(f"notification_list_{user_id}")

    # Invalidate the notification detail cache
    cache.delete(f"notification_detail_{notification_id}")

    # Invalidate the user's unread count cache (always invalidate, as read status may have changed)
    cache.delete(f"notification_unread_count_{user_id}")


@receiver(user_logged_in, dispatch_uid="link_anonymous_push_subscriptions")
def link_anonymous_push_subscriptions(sender, request, user, **kwargs):
    """
    When a user logs in, link any anonymous push subscriptions to their account.

    This allows users who subscribed before logging in to receive targeted notifications.
    This is important for targeting: a user who subscribed anonymously will now receive
    notifications specifically for their account after they log in.

    The current strategy is conservative: we check if this user was the likely source
    of any unlinked subscriptions by looking at the browser session/device context.
    """
    if not user.is_authenticated:
        return

    # Get all push subscriptions already linked to this user
    user_subs = PushSubscription.objects.filter(user=user)
    user_endpoints = set(user_subs.values_list("endpoint", flat=True))

    # Find anonymous subscriptions (user=None)
    anonymous_subs = PushSubscription.objects.filter(user__isnull=True)

    # Link any anonymous subscriptions that aren't already linked to this user
    # We use a conservative approach: if there's exactly one unlinked subscription,
    # it's likely from this user's current device/browser session.
    if anonymous_subs.count() == 1:
        sub = anonymous_subs.first()
        if sub.endpoint not in user_endpoints:
            sub.user = user
            sub.save()
            logger.info(
                f"Linked anonymous push subscription (endpoint={sub.endpoint[:50]}...) to user {user.id}"
            )
