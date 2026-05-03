import uuid
from django.db import models
from django.conf import settings
from .activity_log import SourceChoices

User = settings.AUTH_USER_MODEL


class ErrorLog(models.Model):
    """
    Dedicated error and exception tracking.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    request_id = models.CharField(max_length=100, blank=True, db_index=True)
    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="error_logs",
    )
    source = models.CharField(
        max_length=50,
        choices=SourceChoices.choices,
        default=SourceChoices.SERVICE,
        db_index=True,
        help_text="The code path or service that generated this error (e.g. API, signal, celery task, middleware)",
    )
    error_type = models.CharField(
        max_length=200,
        db_index=True,
        help_text='Exception class name (e.g. "ValueError", "DatabaseError")',
    )
    error_message = models.TextField(help_text="Exception message /  description")
    stack_trace = models.TextField(blank=True, help_text="Full stack trace")
    path = models.CharField(
        max_length=500,
        blank=True,
        help_text="URL path where the error occurred",
    )
    extra = models.JSONField(
        default=dict,
        blank=True,
        help_text="Additional context data",
    )
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["error_type", "-created_at"]),
            models.Index(fields=["source", "-created_at"]),
            models.Index(fields=["-created_at"]),
        ]
        verbose_name = "Error Log"
        verbose_name_plural = "Error Logs"

    def __str__(self):
        return f"{self.error_type}: {self.error_message[:50]}"
