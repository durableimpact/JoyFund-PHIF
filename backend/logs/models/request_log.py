import uuid
from django.db import models
from django.conf import settings
from .activity_log import SourceChoices

User = settings.AUTH_USER_MODEL


class RequestLog(models.Model):
    """
    Tracks every HTTP API request and response.
    """

    HTTP_METHODS = [
        ("GET", "GET"),
        ("POST", "POST"),
        ("PUT", "PUT"),
        ("PATCH", "PATCH"),
        ("DELETE", "DELETE"),
        ("HEAD", "HEAD"),
        ("OPTIONS", "OPTIONS"),
        ("TRACE", "TRACE"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    request_id = models.CharField(max_length=100, db_index=True, unique=False)
    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="request_logs",
    )
    source = models.CharField(
        max_length=50,
        choices=SourceChoices.choices,
        default=SourceChoices.API,
        db_index=True,
        help_text="The code path or service that generated this request (API, middleware, etc.)",
    )
    method = models.CharField(max_length=10, choices=HTTP_METHODS)
    path = models.CharField(max_length=500, db_index=True)
    query_params = models.JSONField(default=dict, blank=True)
    request_body = models.TextField(
        blank=True,
        help_text="Sanitized request body (no passwords/tokens)",
    )
    status_code = models.PositiveSmallIntegerField(db_index=True)
    response_time_ms = models.PositiveIntegerField(
        help_text="How long the request took in milliseconds",
    )
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    referrer = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["path", "-created_at"]),
            models.Index(fields=["status_code", "-created_at"]),
            models.Index(fields=["user", "-created_at"]),
            models.Index(fields=["source", "-created_at"]),
        ]
        verbose_name = "Request Log"
        verbose_name_plural = "Request Logs"

    def __str__(self):
        return (
            f"{self.method} {self.path} [{self.status_code}] {self.response_time_ms}ms"
        )
