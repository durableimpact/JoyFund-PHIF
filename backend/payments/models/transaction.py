import uuid
from django.db import models
from utils.models import BaseEvent
from campaigns.models import Donation
from .account import Account
from .gateway import PaymentGateway

class Transaction(models.Model):

    TRANSACTION_TYPES = [
        ('DONATION', 'Donation'),
        ('PLATFORM_FEE', 'Platform Fee'),
        ('DISBURSEMENT', 'Disbursement'),
        ('REFUND', 'Refund'),
    ]

    TRANSACTION_STATUS = [
        ('SUCCESSFUL', 'Successful'),
        ('FAILED', 'Failed'),
        ('PENDING', 'Pending'),
    ]

    # Maps each transaction type to its natural flow direction.
    _TYPE_DIRECTION = {
        'DONATION':   'IN',
        'REFUND':     'OUT',
        'WITHDRAWAL': 'OUT',
    }

    class Direction(models.TextChoices):
        IN = 'IN',  'Incoming'
        OUT = 'OUT', 'Outgoing'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    donation = models.ForeignKey(
        Donation,
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name="transactions"
    )
    type = models.CharField(max_length=20, choices=TRANSACTION_TYPES)
    direction = models.CharField(
        max_length=3,
        choices=Direction.choices,
        help_text='IN = money entering the system/account; OUT = money leaving.',
    )
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=10, default='XAF')

    gateway = models.ForeignKey(PaymentGateway, on_delete=models.SET_NULL, null=True, blank=True, related_name='transactions')
    gateway_transaction_id = models.CharField(
        max_length=100, blank=True, unique=True,)  # From payment gateway

    # "PENDING", "SUCCESS", "FAILED"    
    status = models.CharField(
        max_length=20, choices=TRANSACTION_STATUS, default='PENDING')
    source = models.ForeignKey(Account, on_delete=models.SET_NULL,
                               null=True, blank=True, related_name='outgoing_transactions')
    destination = models.ForeignKey(
        Account, on_delete=models.SET_NULL, null=True, blank=True, related_name='incoming_transactions')
    # For any additional info like error messages, etc.
    metadata = models.JSONField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['source', 'destination', 'created_at']),
        ]

    def save(self, *args, **kwargs):
        # Auto-derive direction from type when not explicitly set
        if not self.direction and self.type in self._TYPE_DIRECTION:
            self.direction = self._TYPE_DIRECTION[self.type]
        super().save(*args, **kwargs)

    def __str__(self):
        return f"[{self.direction}] {self.type} — {self.amount} {self.currency} ({self.status})"


class TransactionEvent(BaseEvent):
    """
    Tracks all the status changes that happen on a Transaction
    """
    transaction = models.ForeignKey(
        Transaction, 
        on_delete=models.CASCADE, 
        related_name="events"
    )

