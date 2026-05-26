from django.db import models
from django.utils import timezone
from datetime import timedelta
import string
import random
from accounts.models.user import User


def _generate_otp():
    """Generates a random 6-digit OTP."""
    return ''.join(random.choices(string.digits, k=6))


class EmailVerificationToken(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='email_verifications')
    code = models.CharField(max_length=6, default=_generate_otp)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()

    def save(self, *args, **kwargs):
        if not self.expires_at:
            # Expires in 15 minutes
            self.expires_at = timezone.now() + timedelta(minutes=15)
        super().save(*args, **kwargs)

    @property
    def is_valid(self):
        return timezone.now() <= self.expires_at
