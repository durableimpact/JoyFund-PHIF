import uuid
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class PushSubscription(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="push_subscriptions"
    )
    endpoint = models.URLField(max_length=500)
    p256dh_key = models.CharField(max_length=256)
    auth_key = models.CharField(max_length=64)
    user_agent = models.CharField(max_length=500, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user"]),
            models.Index(fields=["endpoint"]),
        ]

    def __str__(self):
        return f"PushSubscription for {self.user.email}"
