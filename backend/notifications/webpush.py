import logging
from urllib.parse import urljoin

from django.conf import settings
from pywebpush import WebPushException, webpush

logger = logging.getLogger(__name__)


def _get_absolute_url(relative_url):
    """
    Convert a relative URL to an absolute URL for push notifications.

    Push services require absolute URLs to fetch images, as they don't have
    context about the origin when the notification is delivered.

    Args:
        relative_url (str): A relative URL (e.g., "/web-app-manifest-192x192.png")
                           or already absolute URL

    Returns:
        str: Absolute URL (e.g., "https://joy-fund.com/web-app-manifest-192x192.png")
    """
    # If already absolute, return as-is
    if relative_url.startswith(("http://", "https://")):
        return relative_url

    # Get the frontend URL from settings (e.g., "https://joy-fund.com" or "http://localhost:3000")
    # FRONTEND_URL is configured in .env and already set up for production (joy-fund.com)
    frontend_url = getattr(settings, "FRONTEND_URL", "http://localhost:3000")

    # Ensure relative_url starts with /
    if not relative_url.startswith("/"):
        relative_url = "/" + relative_url

    # Use urljoin to properly combine the URLs
    return urljoin(frontend_url, relative_url)


def send_push_notification(subscription, title, body, icon=None, url=None, tag=None):
    """
    Send a web push notification to a subscription.

    Args:
        subscription: PushSubscription model instance
        title (str): Notification title
        body (str): Notification body text
        icon (str, optional): Icon URL (will be converted to absolute URL)
        url (str, optional): URL to open when notification is clicked
        tag (str, optional): Notification tag (for grouping)

    Returns:
        bool: True if sent successfully, False otherwise
    """
    if not settings.VAPID_PRIVATE_KEY or not settings.VAPID_PUBLIC_KEY:
        logger.warning("VAPID keys not configured, skipping push notification")
        return False

    # Convert icon paths to absolute URLs so push services can fetch them
    default_icon = _get_absolute_url("/web-app-manifest-192x192.png")
    default_badge = _get_absolute_url("/web-app-manifest-192x192.png")

    payload = {
        "title": title,
        "body": body,
        "icon": _get_absolute_url(icon) if icon else default_icon,
        "badge": default_badge,
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
    """
    Send a push notification to all subscriptions of a user.

    Args:
        user: Django User instance
        title (str): Notification title
        body (str): Notification body text
        icon (str, optional): Icon URL
        url (str, optional): URL to open when clicked
        tag (str, optional): Notification tag

    Returns:
        int: Number of notifications sent successfully
    """
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
    """
    Send a broadcast push notification to all users with subscriptions.

    Args:
        title (str): Notification title
        body (str): Notification body text
        icon (str, optional): Icon URL
        url (str, optional): URL to open when clicked
        tag (str, optional): Notification tag

    Returns:
        int: Number of notifications sent successfully
    """
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
