from django.template.loader import render_to_string
from django.conf import settings
from accounts.models.verification import EmailVerificationToken
from accounts.tasks.send_mail import send_email
import logging

logger = logging.getLogger(__name__)

def send_verification_email(user):
    """Generates an OTP and sends it to the user's email."""
    # Delete any existing valid tokens to prevent confusion
    EmailVerificationToken.objects.filter(user=user).delete()
    
    token_obj = EmailVerificationToken.objects.create(user=user)
    
    subject = 'Verify Your Email - JoyFund'
    context = {
        'first_name': user.first_name,
        'app_name': 'JoyFund',
        'otp_code': token_obj.token,
        'duration': 15,
    }
    
    try:
        # Check if email template exists, if not fallback to basic text body (though send_email expects html)
        html_message = f"Hello {user.first_name},<br><br>Your email verification code is <b>{token_obj.token}</b>. It expires in 15 minutes."
        try:
            html_message = render_to_string('emails/verify_email.html', context)
        except Exception:
            pass

        send_email.delay(
            subject=subject,
            recipient_email=user.email,
            html_message=html_message,
        )
        return True
    except Exception as e:
        logger.error(f"Error sending verification email to {user.email}: {str(e)}")
        return False
