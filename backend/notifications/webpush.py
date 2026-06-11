import logging
from django.conf import settings
from pywebpush import webpush, WebPushException

logger = logging.getLogger(__name__)


def send_push_notification(subscription, title, body, icon=None, url=None, tag=None):
    if not settings.VAPID_PRIVATE_KEY or not settings.VAPID_PUBLIC_KEY:
        logger.warning("VAPID keys not configured, skipping push notification")
        return False

    payload = {
        "title": title,
        "body": body,
        "icon": icon or "/web-app-manifest-192x192.png",
        "badge": "/web-app-manifest-192x192.png",
    }
    if url:
        payload["data"] = {"url": url}
    if tag:
        payload["tag"] = tag

    sub_info = {
        "endpoint": subscription.endpoint,
        "keys": {
            "p256dh": subscription.p256dh_key,
            "auth": subscription.auth_key,
        },
    }

    try:
        webpush(
            subscription_info=sub_info,
            data=payload,
            vapid_private_key=settings.VAPID_PRIVATE_KEY,
            vapid_claims=settings.VAPID_CLAIMS,
        )
        return True
    except WebPushException as e:
        if e.response and e.response.status_code == 410:
            logger.info(f"Push subscription expired, deleting: {subscription.endpoint}")
            subscription.delete()
        else:
            logger.error(f"WebPush failed: {str(e)}")
        return False
    except Exception as e:
        logger.error(f"Unexpected error sending push: {str(e)}")
        return False


def send_push_notification_to_user(user, title, body, icon=None, url=None, tag=None):
    subscriptions = user.push_subscriptions.all()
    if not subscriptions.exists():
        logger.debug(f"No push subscriptions for user {user.id}")
        return 0

    sent = 0
    for sub in subscriptions:
        if send_push_notification(sub, title, body, icon, url, tag):
            sent += 1
    return sent


def send_push_notification_to_all_users(title, body, icon=None, url=None, tag=None):
    from notifications.models import PushSubscription

    subscriptions = PushSubscription.objects.select_related("user").all()
    if not subscriptions.exists():
        logger.debug("No push subscriptions found")
        return 0

    sent = 0
    for sub in subscriptions:
        if send_push_notification(sub, title, body, icon, url, tag):
            sent += 1
    return sent
