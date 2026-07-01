import uuid

from django.db import models


class CampaignView(models.Model):
    class Source(models.TextChoices):
        PUSH = "push", "Push Notification"
        SOCIAL = "social", "Social Media"
        GOOGLE = "google", "Google / Search"
        EMAIL = "email", "Email"
        DIRECT = "direct", "Direct"
        OTHER = "other", "Other"

    campaign = models.ForeignKey(
        "campaigns.Campaign", on_delete=models.CASCADE, related_name="views"
    )
    source = models.CharField(max_length=20, choices=Source.choices, db_index=True)
    visitor_hash = models.CharField(max_length=64, db_index=True)
    referrer = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["campaign", "created_at"]),
            models.Index(fields=["campaign", "visitor_hash"]),
            models.Index(fields=["campaign", "source", "created_at"]),
        ]

    def __str__(self):
        return f"View({self.source}) on {self.campaign_id} by {self.visitor_hash[:12]}..."
