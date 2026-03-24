"""
Django signals for the accounts app.
Handles events like user creation, updates, etc.
"""
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.template.loader import render_to_string
from django.conf import settings

from accounts.models import User
from accounts.tasks.send_mail import send_email


@receiver(post_save, sender=User, dispatch_uid='send_welcome_email_on_user_create')
def send_welcome_email_on_user_creation(sender, instance, created, **kwargs):
    """
    Signal handler that sends a welcome email when a new user is created.
    
    This constructs the welcome email and triggers the async send_email task.
    Email construction happens here so different email types can be built as needed.
    The actual sending happens asynchronously in Celery, so it doesn't block user creation.
    If email sending fails, it will retry up to 3 times before giving up silently.
    
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
            'login_url': getattr(settings, 'FRONTEND_URL', 'https://joyfund.app'),
        }
        
        # Render HTML email template
        html_message = render_to_string('emails/welcome.html', context)
        
        # Trigger async task - this returns immediately, doesn't block
        send_email.delay(
            subject=subject,
            recipient_email=instance.email,
            html_message=html_message,
        )
