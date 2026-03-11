from django.db import models
from django.core.exceptions import ValidationError
import uuid
from campaigns.models import Donation
from polymorphic.models import PolymorphicModel


class Account(PolymorphicModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255, blank=True)
    balance = models.DecimalField(
        max_digits=12, decimal_places=2, default=0)  # In XAF

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class SingletonAccountMixin:
    """
    Enforces a single-row constraint on any Account subclass that mixes this in.

    Usage:
        instance = EscrowAccount.get_instance()   # creates if missing, returns existing otherwise
    """

    @classmethod
    def get_instance(cls):
        """Return the sole instance, creating it if it does not yet exist."""
        obj, _ = cls.objects.get_or_create(
            pk=cls._singleton_pk(),
        )
        return obj

    @classmethod
    def _singleton_pk(cls):
        """
        Return a stable, deterministic UUID derived from the class name so the
        singleton row always has the same PK — safe to call before the row exists.
        """
        import uuid as _uuid
        return _uuid.uuid5(_uuid.NAMESPACE_DNS, f'singleton.{cls.__name__}')

    def save(self, *args, **kwargs):
        """Prevent creating a second row and default name to class name."""
        if not self.pk:
            # New object — check whether one already exists
            if self.__class__.objects.exists():
                raise ValidationError(
                    f"Only one {self.__class__.__name__} instance is allowed. "
                    "Use .get_instance() to retrieve or create it."
                )
            # Pin the PK to the deterministic singleton UUID on first creation
            self.pk = self.__class__._singleton_pk()
        # Set name to class name only when it hasn't been given a value yet
        if not self.name:
            self.name = self.__class__.__name__
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        raise ValidationError(
            f"{self.__class__.__name__} is a singleton and cannot be deleted."
        )


class EscrowAccount(SingletonAccountMixin, Account):

    def __str__(self):
        return f"{self.name} - Balance: {self.balance} XAF"


class FeeAccount(SingletonAccountMixin, Account):

    def __str__(self):
        return f"{self.name} - Balance: {self.balance} XAF"


class FeePolicy(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)

    platform_fee_percentage = models.DecimalField(
        max_digits=5, decimal_places=2)  # e.g. 2.5 for 2.5%
    escrow_fee_percentage = models.DecimalField(
        max_digits=5, decimal_places=2)  # e.g. 1.0 for 1%

    # the total of platform_fee_percentage + escrow_fee_percentage should ideally be  100%

    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def clean(self):
        total = self.platform_fee_percentage + self.escrow_fee_percentage
        if total != 100:
            raise ValidationError("Fee percentages must sum to 100%.")

    def __str__(self):
        return self.name


class PaymentGateway(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class WebhookEvent(models.Model):
    id = models.AutoField(primary_key=True)
    gateway = models.ForeignKey(
        PaymentGateway, on_delete=models.CASCADE, related_name='webhook_events')
    # e.g. "payment_success", "payment_failed", etc.
    event_type = models.CharField(max_length=255)
    payload = models.JSONField()  # Raw JSON payload from the payment provider
    received_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"WebhookEvent {self.event_type} from {self.gateway.name} at {self.received_at}"


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
    # TRANSFER is intentionally excluded — it depends on perspective (source vs destination).
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

    # "MTN Mobile Money", "Orange Money", "Bank Transfer", etc.
    provider = models.ForeignKey(PaymentGateway, on_delete=models.SET_NULL, null=True, blank=True, related_name='transactions')
    provider_transaction_id = models.CharField(
        max_length=100, blank=True,unique=True,)  # From payment provider

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

    def save(self, *args, **kwargs):
        # Auto-derive direction from type when not explicitly set
        if not self.direction and self.type in self._TYPE_DIRECTION:
            self.direction = self._TYPE_DIRECTION[self.type]
        super().save(*args, **kwargs)

    def __str__(self):
        return f"[{self.direction}] {self.type} — {self.amount} {self.currency} ({self.status})"


class FeeSplit(models.Model):
    id = models.AutoField(primary_key=True)
    transaction = models.ForeignKey(
        Transaction, on_delete=models.CASCADE, related_name='fee_splits')
    

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"FeeSplit of {self.amount} XAF to {self.account.name} for Transaction {self.transaction.id}"