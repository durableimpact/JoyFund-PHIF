"""
Email sending for the newsletter subscription flow.

Reuses the generic ``send_async_email`` Celery task used everywhere else in the
platform (welcome emails, verification emails, notifications, etc.) so that the
newsletter follows the exact same, working email infrastructure.
"""
import logging
from datetime import datetime

from django.conf import settings
from django.template.loader import render_to_string

from accounts.tasks.send_mail import send_async_email

logger = logging.getLogger(__name__)

# The admin who should be notified whenever a new subscriber joins.
# Emails are *sent from* ``DEFAULT_FROM_EMAIL`` (the Gmail SMTP account),
# and this is the recipient who receives the new-subscriber notification.
NEWSLETTER_ADMIN_EMAIL = getattr(
    settings, "NEWSLETTER_ADMIN_EMAIL", "admin@joy-fund.com"
)


def send_newsletter_subscription_emails(email):
    """
    Send the "thank you for subscribing" email to the subscriber and notify the
    admin about the new subscription.

    Args:
        email (str): The subscriber's email address.
    """
    app_name = "JoyFund"
    year = datetime.now().year
    subscribed_at = datetime.now().strftime("%Y-%m-%d %H:%M")

    # 1) Thank-you email to the subscriber
    try:
        welcome_context = {"app_name": app_name, "year": year}
        welcome_html = render_to_string(
            "emails/newsletter_welcome.html", welcome_context
        )
        send_async_email.delay(
            subject="Welcome to the JoyFund Newsletter - Thank You for Subscribing!",
            recipient_email=email,
            html_message=welcome_html,
        )
        logger.info(f"Newsletter welcome email queued for {email}")
    except Exception as exc:
        logger.error(
            f"Error queuing newsletter welcome email for {email}: {str(exc)}"
        )

    # 2) Admin notification email
    try:
        admin_context = {
            "app_name": app_name,
            "year": year,
            "email": email,
            "subscribed_at": subscribed_at,
        }
        admin_html = render_to_string(
            "emails/newsletter_new_subscriber.html", admin_context
        )
        send_async_email.delay(
            subject=f"New Newsletter Subscriber: {email}",
            recipient_email=NEWSLETTER_ADMIN_EMAIL,
            html_message=admin_html,
        )
        logger.info(f"Newsletter admin notification queued to {NEWSLETTER_ADMIN_EMAIL}")
    except Exception as exc:
        logger.error(
            f"Error queuing newsletter admin notification for {email}: {str(exc)}"
        )
