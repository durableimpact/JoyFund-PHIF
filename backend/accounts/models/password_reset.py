import uuid
import string
import random
from django.db import models
from django.utils import timezone
from datetime import timedelta
from accounts.models.user import User


def _generate_reset_code():
    """Generates a random 6-digit reset code."""
    return ''.join(random.choices(string.digits, k=6))


class PasswordResetToken(models.Model):
    """
    Model for password reset tokens.
    Each token is a 6-digit code and expires after a set time (24 hours by default).
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='password_reset_tokens'
    )
    code = models.CharField(
        max_length=6,
        default=_generate_reset_code,
        help_text="6-digit code for password reset"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(
        default=False,
        help_text="Indicates if this token has been used for password reset"
    )

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['code']),
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['is_used', 'expires_at']),
        ]

    def save(self, *args, **kwargs):
        if not self.expires_at:
            # Expires in 24 hours
            self.expires_at = timezone.now() + timedelta(hours=24)
        super().save(*args, **kwargs)

    @property
    def is_valid(self):
        """Check if token is still valid (not expired and not used)."""
        return timezone.now() <= self.expires_at and not self.is_used

    @property
    def has_expired(self):
        """Check if token has expired."""
        return timezone.now() > self.expires_at

    def __str__(self):
        return f"Password Reset Token for {self.user.email}"
