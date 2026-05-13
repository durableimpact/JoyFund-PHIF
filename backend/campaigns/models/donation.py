from django.db import models
import uuid
from decimal import Decimal, ROUND_HALF_UP
from accounts.models import Donor
from .campaign import Campaign
from .payment import Payment


class Donation(models.Model):
    STATUS_CHOICES = [
        ("PENDING", "Pending"),
        ("SUCCESS", "Success"),
        ("FAILED", "Failed"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    donor = models.ForeignKey(
        Donor,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="donations",
    )
    campaign = models.ForeignKey(
        Campaign, on_delete=models.CASCADE, related_name="donations"
    )
    donor_name = models.CharField(
        max_length=100, blank=True, null=True, default="Anonymous"
    )
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default="PENDING")
    message = models.TextField(blank=True)  # "Congrats Junior!"

    platform_fee_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        editable=False,
        help_text="5% platform management fee (immutable once SUCCESS)",
    )
    net_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        editable=False,
        help_text="95% that enters the People's Health Insurance Fund",
    )

    is_anonymous = models.BooleanField(default=False)
    payment = models.OneToOneField(
        Payment, on_delete=models.CASCADE, related_name="donation"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=["status"]),
            models.Index(fields=["campaign"]),
            models.Index(fields=["donor"]),
        ]

    def save(self, *args, **kwargs):
        # Automatically calculate platform fee and net amount on save
        # Calculate fee ONLY when status becomes SUCCESS and hasn't been calculated yet
        if self.status == "SUCCESS" and self.payment and self.platform_fee_amount == 0:

            received_amount = self.payment.app_amount

            fee = (received_amount * Decimal("0.05")).quantize(
                Decimal("0.01"), rounding=ROUND_HALF_UP
            )

            self.platform_fee_amount = fee
            self.net_amount = received_amount - fee

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.amount} XAF to {self.campaign.title} by {self.donor_name}"
