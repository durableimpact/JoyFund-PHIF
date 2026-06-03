"""
Celery tasks for sending emails.
Generic mail sending task that can be reused for any email type.
"""
import logging
from django.core.mail import send_mail
from django.utils.html import strip_tags
from django.conf import settings

from backend.celery import app


logger = logging.getLogger(__name__)


@app.task(bind=True, max_retries=3, default_retry_delay=60)
def send_email(self, subject, recipient_email, html_message, plain_message=None, from_email=None):
    """
    Generic task to send emails asynchronously with retry logic.
    
    This task can be used for any type of email (welcome, reset password, notifications, etc.).
    It runs asynchronously and will retry up to 3 times if it fails.
    Failures do not block the caller operation.
    
    Args:
        subject (str): The email subject
        recipient_email (str or list): The recipient email address or list of email addresses
        html_message (str): The HTML message body
        plain_message (str, optional): Plain text message body. If not provided, HTML tags are stripped.
        from_email (str, optional): Sender email. Defaults to DEFAULT_FROM_EMAIL from settings.
    
    Returns:
        str: Success or failure message
    """
    logger.info(f"Starting send_email task — subject='{subject}', to='{recipient_email}'")
    
    try:
        from_email = from_email or settings.DEFAULT_FROM_EMAIL
        
        # Ensure recipient_email is a list
        if isinstance(recipient_email, str):
            recipient_list = [recipient_email]
        else:
            recipient_list = list(recipient_email)
        
        # Create plain text fallback if not provided
        if plain_message is None:
            plain_message = strip_tags(html_message)
        
        # Send email
        send_mail(
            subject=subject,
            message=plain_message,
            from_email=from_email,
            recipient_list=recipient_list,
            html_message=html_message,
            fail_silently=False,
        )
        
        recipients_str = ', '.join(recipient_list)
        logger.info(f"Email sent successfully to {recipients_str}")
        return f"Email sent successfully to {recipients_str}"
        
    except Exception as exc:
        recipients_str = recipient_email if isinstance(recipient_email, str) else ', '.join(recipient_email)
        retry_count = self.request.retries
        
        if retry_count < self.max_retries:
            logger.warning(
                f"Email to {recipients_str} failed (attempt {retry_count + 1}/{self.max_retries + 1}), "
                f"retrying in {60 * (retry_count + 1)}s. Error: {str(exc)}"
            )
            retry_delay = 60 * (retry_count + 1)
            raise self.retry(exc=exc, countdown=retry_delay)
        else:
            logger.error(
                f"Failed to send email to {recipients_str} after {self.max_retries + 1} attempts. "
                f"Subject: '{subject}'. Error: {str(exc)}"
            )
            return f"Failed to send email to {recipients_str} after {self.max_retries} retries"
