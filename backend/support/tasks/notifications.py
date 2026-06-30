"""
Celery tasks for the support app.
"""

import logging

from celery import shared_task
from django.contrib.auth import get_user_model

User = get_user_model()
logger = logging.getLogger("support")


@shared_task(bind=True, max_retries=3)
def send_ticket_notification_email(self, user_id, subject, message):
    """
    Send an email notification for support ticket events.
    """
    try:
        user = User.objects.get(id=user_id)
        from accounts.tasks.send_mail import send_async_email

        send_async_email.delay(
            subject=f"[JoyFund Support] {subject}",
            recipient_email=user.email,
            html_message=message,
        )
        logger.info(f"Ticket notification email sent to {user.email}")
    except User.DoesNotExist:
        logger.error(f"User {user_id} not found for ticket notification email")
    except Exception as exc:
        logger.error(f"Failed to send ticket notification email: {exc}")
        self.retry(exc=exc, countdown=60)
