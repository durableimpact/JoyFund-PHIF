import uuid
from django.db import models
from django.conf import settings
from django.utils import timezone
from utils.models import BaseEvent


class TicketStatus(models.TextChoices):
    OPEN = "OPEN", "Open"
    IN_PROGRESS = "IN_PROGRESS", "In Progress"
    WAITING_FOR_USER = "WAITING_FOR_USER", "Waiting for User"
    RESOLVED = "RESOLVED", "Resolved"
    CLOSED = "CLOSED", "Closed"


class TicketCategory(models.TextChoices):
    GENERAL = "GENERAL", "General Inquiry"
    BUG_REPORT = "BUG_REPORT", "Bug Report"
    FEATURE_REQUEST = "FEATURE_REQUEST", "Feature Request"
    ACCOUNT_ISSUE = "ACCOUNT_ISSUE", "Account Issue"
    PAYMENT_ISSUE = "PAYMENT_ISSUE", "Payment Issue"
    VOUCHER_ISSUE = "VOUCHER_ISSUE", "Voucher Issue"
    HOSPITAL_ISSUE = "HOSPITAL_ISSUE", "Hospital Issue"
    BENEFICIARY_ISSUE = "BENEFICIARY_ISSUE", "Beneficiary Issue"
    OTHER = "OTHER", "Other"


class TicketPriority(models.TextChoices):
    LOW = "LOW", "Low"
    MEDIUM = "MEDIUM", "Medium"
    HIGH = "HIGH", "High"
    URGENT = "URGENT", "Urgent"


class SupportTicket(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    ticket_number = models.CharField(max_length=20, unique=True, editable=False)

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="created_tickets",
    )
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_tickets",
    )

    subject = models.CharField(max_length=255)
    description = models.TextField()
    category = models.CharField(
        max_length=20, choices=TicketCategory, default=TicketCategory.GENERAL
    )
    priority = models.CharField(
        max_length=10, choices=TicketPriority, default=TicketPriority.MEDIUM
    )
    status = models.CharField(
        max_length=20, choices=TicketStatus, default=TicketStatus.OPEN
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    closed_at = models.DateTimeField(null=True, blank=True)

    resolution_notes = models.TextField(blank=True)

    class Meta:
        indexes = [
            models.Index(fields=["status"]),
            models.Index(fields=["category"]),
            models.Index(fields=["priority"]),
            models.Index(fields=["created_by"]),
            models.Index(fields=["assigned_to"]),
            models.Index(fields=["created_at"]),
            models.Index(fields=["ticket_number"]),
        ]
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.ticket_number} - {self.subject}"

    def save(self, *args, **kwargs):
        if not self.ticket_number:
            self.ticket_number = self._generate_ticket_number()
        super().save(*args, **kwargs)

    def _generate_ticket_number(self):
        year = timezone.now().year
        last_ticket = (
            SupportTicket.objects.filter(ticket_number__startswith=f"TKT-{year}-")
            .order_by("-ticket_number")
            .first()
        )
        if last_ticket:
            last_number = int(last_ticket.ticket_number.split("-")[-1])
            new_number = last_number + 1
        else:
            new_number = 1
        return f"TKT-{year}-{new_number:05d}"


class TicketEvent(BaseEvent):
    ticket = models.ForeignKey(
        SupportTicket, on_delete=models.CASCADE, related_name="events"
    )
