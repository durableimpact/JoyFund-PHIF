import uuid
from django.db import models
from django.utils import timezone
from datetime import timedelta
from accounts.models.user import User


class PasswordResetToken(models.Model):
    """
    Model for password reset tokens.
    Each token is unique and expires after a set time (24 hours by default).
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='password_reset_tokens'
    )
    token = models.CharField(
        max_length=255,
        unique=True,
        help_text="Unique token for password reset"
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
            models.Index(fields=['token']),
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
