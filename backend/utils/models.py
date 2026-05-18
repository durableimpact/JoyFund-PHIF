import uuid
from django.db import models
from django.conf import settings


class BaseEvent(models.Model):
    """
    Abstract base model to track status changes for full traceability.
    Each model that requires tracking should have an associated Event model
    that inherits from this base class and adds a ForeignKey to the target model.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    status = models.CharField(
        max_length=50, 
        help_text="The new status of the tracked object."
    )
    changed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        help_text="The user who made the status change."
    )
    changed_at = models.DateTimeField(
        auto_now_add=True, 
        help_text="Timestamp of when the change occurred."
    )
    notes = models.TextField(
        blank=True, 
        help_text="Optional notes or reasons for the change."
    )

    class Meta:
        abstract = True
        ordering = ['-changed_at']

    def __str__(self):
        return f"{self.__class__.__name__} - {self.status} at {self.changed_at}"
