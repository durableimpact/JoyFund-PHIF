from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from django.template.loader import render_to_string
from accounts.models.password_reset import PasswordResetToken
from accounts.tasks.send_mail import send_async_email


def send_password_reset_email(user, request):
    """
    Generate a password reset code and send it to user's email.
    
    Args:
        user: User instance
        request: Django request object (used to build absolute URLs)
    
    Returns:
        dict: Contains 'success' (bool) and 'message' (str) keys
    """
    try:
        # Invalidate any existing unused codes for this user
        PasswordResetToken.objects.filter(
            user=user,
            is_used=False
        ).update(is_used=True)
        
        # Create new reset code
        reset_token = PasswordResetToken.objects.create(user=user)
        
        # Prepare email context
        email_context = {
            'first_name': user.first_name,
            'reset_code': reset_token.code,
            'duration': 24,
        }
        
        # Prepare email metadata
        subject = 'Password Reset Request - JoyFund PHIF'
        
        try:
            html_message = render_to_string('emails/password_reset_email.html', email_context)
        except Exception:
            html_message = f"Hello {user.first_name},<br><br>Your password reset code is <b>{reset_token.code}</b>. It expires in 24 hours."
        
        # Send email asynchronously
        send_async_email.delay(
            subject=subject,
            recipient_email=user.email,
            html_message=html_message,
        )
        
        return {
            'success': True,
            'message': f'Password reset code sent to {user.email}'
        }
        
    except Exception as e:
        return {
            'success': False,
            'message': f'Failed to send reset email: {str(e)}'
        }


def validate_reset_token(code_string):
    """
    Validate a password reset code.
    
    Args:
        code_string: Code string to validate
    
    Returns:
        tuple: (is_valid, token_obj, error_message)
            - is_valid (bool): Whether code is valid
            - token_obj (PasswordResetToken or None): Token object if valid
            - error_message (str): Description of error if invalid
    """
    try:
        # Get code from database (get most recent by this code for the user)
        reset_token = PasswordResetToken.objects.get(code=code_string)
        
        # Check if already used
        if reset_token.is_used:
            return False, None, 'This password reset code has already been used.'
        
        # Check if expired
        if reset_token.has_expired:
            return False, None, 'This password reset code has expired. Please request a new one.'
        
        return True, reset_token, None
        
    except PasswordResetToken.DoesNotExist:
        return False, None, 'Invalid password reset code. Please request a new password reset.'
    except Exception as e:
        return False, None, f'Error validating code: {str(e)}'


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
