import uuid

from django.db import models


class PushBroadcastTask(models.Model):
    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        RUNNING = "RUNNING", "Running"
        COMPLETED = "COMPLETED", "Completed"
        FAILED = "FAILED", "Failed"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    status = models.CharField(
        max_length=10, choices=Status.choices, default=Status.PENDING, db_index=True,
    )
    target = models.CharField(max_length=20, help_text="all | roles | user_ids | self")
    target_value = models.JSONField(
        default=list, blank=True,
        help_text="The target value: [] for all/self, role list, or user_id list",
    )

    title = models.CharField(max_length=255)
    body = models.TextField()
    url = models.URLField(blank=True, default="")
    image = models.URLField(blank=True, default="", max_length=500)
    actions = models.JSONField(default=list, blank=True)

    total = models.PositiveIntegerField(default=0)
    sent = models.PositiveIntegerField(default=0)
    failed = models.PositiveIntegerField(default=0)
    errors = models.JSONField(default=list, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["status"]),
            models.Index(fields=["-created_at"]),
        ]

    def __str__(self):
        return f"PushBroadcast({self.status}) {self.title[:40]} — {self.sent}/{self.total}"
