import uuid
from django.db import models
from django.conf import settings
from django.contrib.postgres.fields import ArrayField

# Get the User model
User = settings.AUTH_USER_MODEL


class ActivityLog(models.Model):
    """
    Tracks every meaningful user or system action in the application.
    """
    LEVEL_CHOICES = [
        ('INFO', 'Info'),
        ('WARNING', 'Warning'),
        ('ERROR', 'Error'),
        ('CRITICAL', 'Critical'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='activity_logs',
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
    level = models.CharField(
        max_length=20,
        choices=LEVEL_CHOICES,
        default='INFO',
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
        help_text='PK or UUID of the affected object',
    )
    target_label = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        help_text='Human-readable name of the target object',
    )
    description = models.TextField(
        blank=True,
        help_text='Human-readable sentence describing what happened',
    )
    metadata = models.JSONField(
        default=dict,
        blank=True,
        help_text='Extra structured data relevant to the action',
    )
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    request_id = models.CharField(max_length=100, blank=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['action', '-created_at']),
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['level', '-created_at']),
            models.Index(fields=['target_type', 'target_id']),
        ]
        verbose_name = 'Activity Log'
        verbose_name_plural = 'Activity Logs'

    def __str__(self):
        return f"{self.actor_label} | {self.action} | {self.created_at.strftime('%Y-%m-%d %H:%M:%S')}"


class RequestLog(models.Model):
    """
    Tracks every HTTP API request and response.
    """
    HTTP_METHODS = [
        ('GET', 'GET'),
        ('POST', 'POST'),
        ('PUT', 'PUT'),
        ('PATCH', 'PATCH'),
        ('DELETE', 'DELETE'),
        ('HEAD', 'HEAD'),
        ('OPTIONS', 'OPTIONS'),
        ('TRACE', 'TRACE'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    request_id = models.CharField(max_length=100, db_index=True, unique=False)
    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='request_logs',
    )
    method = models.CharField(max_length=10, choices=HTTP_METHODS)
    path = models.CharField(max_length=500, db_index=True)
    query_params = models.JSONField(default=dict, blank=True)
    request_body = models.TextField(
        blank=True,
        help_text='Sanitized request body (no passwords/tokens)',
    )
    status_code = models.PositiveSmallIntegerField(db_index=True)
    response_time_ms = models.PositiveIntegerField(
        help_text='How long the request took in milliseconds',
    )
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    referrer = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['path', '-created_at']),
            models.Index(fields=['status_code', '-created_at']),
            models.Index(fields=['user', '-created_at']),
        ]
        verbose_name = 'Request Log'
        verbose_name_plural = 'Request Logs'

    def __str__(self):
        return f"{self.method} {self.path} [{self.status_code}] {self.response_time_ms}ms"


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
        related_name='error_logs',
    )
    error_type = models.CharField(
        max_length=200,
        db_index=True,
        help_text='Exception class name (e.g. "ValueError", "DatabaseError")',
    )
    error_message = models.TextField(help_text='Exception message /  description')
    stack_trace = models.TextField(blank=True, help_text='Full stack trace')
    path = models.CharField(
        max_length=500,
        blank=True,
        help_text='URL path where the error occurred',
    )
    extra = models.JSONField(
        default=dict,
        blank=True,
        help_text='Additional context data',
    )
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['error_type', '-created_at']),
            models.Index(fields=['-created_at']),
        ]
        verbose_name = 'Error Log'
        verbose_name_plural = 'Error Logs'

    def __str__(self):
        return f"{self.error_type}: {self.error_message[:50]}"
