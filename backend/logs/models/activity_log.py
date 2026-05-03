import uuid
from django.db import models
from django.conf import settings

User = settings.AUTH_USER_MODEL


class SourceChoices(models.TextChoices):
    """Code path / origin of the log entry."""

    SERVICE = "SERVICE", "Application Service"
    SIGNAL = "SIGNAL", "Django Signal"
    CELERY_TASK = "CELERY_TASK", "Celery Background Task"
    MIDDLEWARE = "MIDDLEWARE", "Django Middleware"
    API = "API", "API Endpoint"
    ADMIN = "ADMIN", "Django Admin"
    MANAGEMENT = "MANAGEMENT", "Management Command"
    WEBHOOK = "WEBHOOK", "Webhook Handler"


class ActivityLog(models.Model):
    """
    Tracks every meaningful user or system action in the application.
    """

    LEVEL_CHOICES = [
        ("INFO", "Info"),
        ("WARNING", "Warning"),
        ("ERROR", "Error"),
        ("CRITICAL", "Critical"),
    ]

    class PortalChoices(models.TextChoices):
        DONOR_PORTAL = "DONOR_PORTAL", "Donor Portal"
        HOSPITAL_ADMIN_PORTAL = "HOSPITAL_ADMIN_PORTAL", "Hospital Admin Portal"
        RECEPTIONIST_PORTAL = "RECEPTIONIST_PORTAL", "Receptionist Portal"
        BENEFICIARY_PORTAL = "BENEFICIARY_PORTAL", "Beneficiary Portal"
        SYSTEM_ADMIN_PORTAL = "SYSTEM_ADMIN_PORTAL", "System Admin Portal"
        SOCIAL_WORKER_PORTAL = "SOCIAL_WORKER_PORTAL", "Social Worker Portal"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="activity_logs",
    )
    actor_label = models.CharField(
        max_length=150,
        help_text='Email, actor identifier, "anonymous", or "system"',
    )
    action = models.CharField(
        max_length=100,
        db_index=True,
        help_text='Short action code like "user.login", "invoice.created"',
    )
    portal = models.CharField(
        max_length=50,
        choices=PortalChoices.choices,
        blank=True,
        null=True,
        db_index=True,
        help_text="The portal or interface where the action occurred (e.g. donor portal, hospital admin portal, etc.)",
    )
    source = models.CharField(
        max_length=50,
        choices=SourceChoices.choices,
        default=SourceChoices.SERVICE,
        db_index=True,
        help_text="The code path or service that generated this log (e.g. API, signal, celery task, middleware)",
    )
    level = models.CharField(
        max_length=20,
        choices=LEVEL_CHOICES,
        default="INFO",
        db_index=True,
    )
    target_type = models.CharField(
        max_length=100,
        null=True,
        blank=True,
        db_index=True,
        help_text='Model name of affected object (e.g. "Invoice", "User")',
    )
    target_id = models.CharField(
        max_length=100,
        null=True,
        blank=True,
        db_index=True,
        help_text="PK or UUID of the affected object",
    )
    target_label = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        help_text="Human-readable name of the target object",
    )
    description = models.TextField(
        blank=True,
        help_text="Human-readable sentence describing what happened",
    )
    metadata = models.JSONField(
        default=dict,
        blank=True,
        help_text="Extra structured data relevant to the action",
    )
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    request_id = models.CharField(max_length=100, blank=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["action", "-created_at"]),
            models.Index(fields=["user", "-created_at"]),
            models.Index(fields=["level", "-created_at"]),
            models.Index(fields=["source", "-created_at"]),
            models.Index(fields=["target_type", "target_id"]),
        ]
        verbose_name = "Activity Log"
        verbose_name_plural = "Activity Logs"

    def __str__(self):
        return f"{self.actor_label} | {self.action} | {self.created_at.strftime('%Y-%m-%d %H:%M:%S')}"
