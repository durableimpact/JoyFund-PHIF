import uuid
from django.db import models
from utils.models import BaseEvent


class Disbursement(models.Model):
    """
    Tracks disbursements made to hospitals.
    This model stores records of payments sent to partner hospitals,
    created either automatically via the system or manually for traceability
    and audit purposes.
    """

    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        COMPLETED = 'COMPLETED', 'Completed'
        FAILED = 'FAILED', 'Failed'
        CANCELLED = 'CANCELLED', 'Cancelled'

    class PaymentMethod(models.TextChoices):
        MOMO = 'MOMO', 'Mobile Money (MTN/Orange)'
        BANK_TRANSFER = 'BANK_TRANSFER', 'Bank Transfer'
        CASH = 'CASH', 'Cash'
        OTHER = 'OTHER', 'Other'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    hospital = models.ForeignKey(
        'hospitals.Hospital',
        on_delete=models.CASCADE,
        related_name='disbursements',
        help_text="The hospital receiving the disbursement."
    )
    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        help_text="Amount disbursed in XAF"
    )
    currency = models.CharField(max_length=10, default='XAF')
    
    # Payment details
    payment_method = models.CharField(
        max_length=20,
        choices=PaymentMethod.choices,
        default=PaymentMethod.MOMO,
        help_text="Method used for disbursement."
    )
    recipient_phone = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        help_text="Recipient's phone number (for MOMO payments)."
    )
    recipient_account = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="Recipient's account/reference (bank account, USSD reference, etc.)."
    )
    
    # Status tracking
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.COMPLETED,
        help_text="Current status of the disbursement. Defaults to COMPLETED since this records payments already made outside the system."
    )
    
    # External reference for traceability
    external_reference = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        unique=True,
        help_text="Reference from external payment system (e.g., Campay transaction ID)."
    )
    gateway_transaction_id = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="Transaction ID from payment gateway."
    )
    
    # Link to internal transaction
    transaction = models.OneToOneField(
        'Transaction',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='disbursement',
        help_text="Associated internal transaction record."
    )
    
    # Additional information
    notes = models.TextField(
        blank=True,
        null=True,
        help_text="Additional notes about the disbursement (e.g., reason, context)."
    )
    error_message = models.TextField(
        blank=True,
        null=True,
        help_text="Error details if disbursement failed."
    )
    
    # Metadata
    metadata = models.JSONField(
        blank=True,
        null=True,
        help_text="Additional structured data about the disbursement."
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Track when the disbursement was actually made (in external system)
    disbursed_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When the disbursement was actually made in the external system."
    )
    
    created_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_disbursements',
        help_text="User who created this disbursement record."
    )

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['hospital', '-created_at']),
            models.Index(fields=['status']),
            models.Index(fields=['external_reference']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f"Disbursement to {self.hospital.name} - {self.amount} XAF ({self.status})"
