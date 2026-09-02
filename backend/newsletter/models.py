import uuid

from django.db import models


class Subscriber(models.Model):
    """A user who has subscribed to the JoyFund newsletter."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True, help_text="Subscriber email address")
    is_active = models.BooleanField(
        default=True,
        help_text="Whether the subscriber is still subscribed",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["email"]),
            models.Index(fields=["-created_at"]),
        ]

    def __str__(self):
        return f"{self.email} - {'active' if self.is_active else 'inactive'}"
