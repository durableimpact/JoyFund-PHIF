from .Voucher import Voucher
from campaigns.models import Campaign
from django.db import models
import uuid


class VoucherFunding(models.Model):

    class FundingStatus(models.TextChoices):
        COMMITTED = (
            "COMMITTED",
            "Committed",
        )  # Funds have been committed but not yet utilized.
        UTILIZED = (
            "UTILIZED",
            "Utilized",
        )  # Funds have been utilized for a redeemed voucher.
        CANCELLED = (
            "CANCELLED",
            "Cancelled",
        )  # Committed funds have been cancelled (e.g. due to voucher expiry or campaign cancellation).

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    voucher = models.ForeignKey(
        Voucher, on_delete=models.CASCADE, related_name="funding_records"
    )
    campaign = models.ForeignKey(
        Campaign,
        on_delete=models.CASCADE,
        related_name="voucher_fundings",
        help_text="The campaign from which these funds were committed",
    )
    committed_amount = models.DecimalField(max_digits=10, decimal_places=2)
    utilized_amount = models.DecimalField(max_digits=10, decimal_places=2)
    refund_amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(
        max_length=20, choices=FundingStatus.choices, default=FundingStatus.COMMITTED
    )
    committed_at = models.DateTimeField(auto_now_add=True)
    utilized_at = models.DateTimeField(null=True, blank=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Funding for Voucher {self.voucher.voucher_code} - {self.status}"

    @property
    def has_refund(self):
        return self.refund_amount > 0

    class Meta:
        indexes = [
            models.Index(fields=["status"]),
            models.Index(fields=["committed_at"]),
            models.Index(fields=["campaign"]),
        ]
