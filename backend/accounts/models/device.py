import uuid

from django.db import models
from django.utils.translation import gettext_lazy as _

from accounts.models import User


class UserDevice(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="devices"
    )

    device_name = models.CharField(
        max_length=255,
        blank=True,
        help_text=_("Human-readable device name e.g. Chrome on Windows"),
    )
    device_type = models.CharField(
        max_length=50,
        blank=True,
        help_text=_("Desktop, Mobile, Tablet, etc."),
    )
    browser = models.CharField(
        max_length=100,
        blank=True,
        help_text=_("Browser name and version"),
    )
    os = models.CharField(
        max_length=100,
        blank=True,
        help_text=_("Operating system name and version"),
    )
    ip_address = models.GenericIPAddressField(
        blank=True, null=True,
        help_text=_("IP address at time of login"),
    )
    user_agent = models.TextField(
        blank=True,
        help_text=_("Full User-Agent header"),
    )

    last_active = models.DateTimeField(
        auto_now=True,
        help_text=_("Last time this device was used"),
    )
    is_trusted = models.BooleanField(
        default=False,
        help_text=_("User has marked this device as trusted"),
    )
    is_blocked = models.BooleanField(
        default=False,
        help_text=_("Device has been blocked by user or admin"),
    )
    access_token = models.ForeignKey(
        "oauth2_provider.AccessToken",
        on_delete=models.SET_NULL,
        null=True, blank=True,
        help_text=_("The access token associated with this device session"),
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-last_active"]
        indexes = [
            models.Index(fields=["user", "-last_active"]),
            models.Index(fields=["user", "is_blocked"]),
        ]

    def __str__(self):
        return f"{self.device_name or 'Unknown device'} ({self.user.email})"
