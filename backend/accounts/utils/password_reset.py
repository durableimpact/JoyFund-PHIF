import secrets
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from django.template.loader import render_to_string
from accounts.models.password_reset import PasswordResetToken


def generate_reset_token():
    """
    Generate a secure random token for password reset.
    Returns a 64-character hexadecimal string.
    """
    return secrets.token_urlsafe(48)


def send_password_reset_email(user, request):
    """
    Generate a password reset token and send a reset link to user's email.
    Uses Django templates for HTML and plain text email versions.
    
    Args:
        user: User instance
        request: Django request object (used to build absolute URLs)
    
    Returns:
        dict: Contains 'success' (bool) and 'message' (str) keys
    """
    try:
        # Invalidate any existing unused tokens for this user
        PasswordResetToken.objects.filter(
            user=user,
            is_used=False
        ).update(is_used=True)
        
        # Generate new token
        token_string = generate_reset_token()
        
        # Create token object in database
        reset_token = PasswordResetToken.objects.create(
            user=user,
            token=token_string
        )
        
        # Build reset link
        # Note: Adjust the frontend URL if your frontend is hosted separately
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
        reset_link = f"{frontend_url}/reset-password?token={token_string}"
        support_url = getattr(settings, 'SUPPORT_URL', 'https://support.joyfund.org')
        
        # Prepare email context
        email_context = {
            'first_name': user.first_name,
            'reset_link': reset_link,
            'support_url': support_url,
        }
        
        # Render email templates
        html_message = render_to_string('emails/password_reset_email.html', email_context)
        plain_message = render_to_string('emails/password_reset_email.txt', email_context)
        
        # Prepare email metadata
        subject = 'Password Reset Request - JoyFund PHIF'
        
        # Send email
        send_mail(
            subject=subject,
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            html_message=html_message,
            fail_silently=False,
        )
        
        return {
            'success': True,
            'message': f'Password reset link sent to {user.email}'
        }
        
    except Exception as e:
        return {
            'success': False,
            'message': f'Failed to send reset email: {str(e)}'
        }


def validate_reset_token(token_string):
    """
    Validate a password reset token.
    
    Args:
        token_string: Token string to validate
    
    Returns:
        tuple: (is_valid, token_obj, error_message)
            - is_valid (bool): Whether token is valid
            - token_obj (PasswordResetToken or None): Token object if valid
            - error_message (str): Description of error if invalid
    """
    try:
        # Get token from database
        reset_token = PasswordResetToken.objects.get(token=token_string)
        
        # Check if already used
        if reset_token.is_used:
            return False, None, 'This password reset link has already been used.'
        
        # Check if expired
        if reset_token.has_expired:
            return False, None, 'This password reset link has expired. Please request a new one.'
        
        return True, reset_token, None
        
    except PasswordResetToken.DoesNotExist:
        return False, None, 'Invalid password reset token. Please request a new password reset.'
    except Exception as e:
        return False, None, f'Error validating token: {str(e)}'


def cleanup_expired_tokens():
    """
    Delete expired password reset tokens.
    This should be called periodically (via a management command or Celery task).
    """
    from django.utils import timezone
    
    expired_count, _ = PasswordResetToken.objects.filter(
        expires_at__lt=timezone.now()
    ).delete()
    
    return expired_count
