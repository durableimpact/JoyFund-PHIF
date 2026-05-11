from django.db import models
from .Voucher import Voucher
from accounts.models import Donor
from uuid import uuid4
from campaigns.models import Campaign


class VoucherNotification(models.Model):

    class NOTIFICATION_MOMENT(models.TextChoices):
        VOUCHER_ISSUED = (
            "VOUCHER_ISSUED",
            "Voucher Issued",
        )  # When a voucher is issued to a beneficiary.
        VOUCHER_APPROVED = (
            "VOUCHER_APPROVED",
            "Voucher Approved",
        )  # When an admin approves a pending voucher.
        VOUCHER_REJECTED = (
            "VOUCHER_REJECTED",
            "Voucher Rejected",
        )  # When an admin rejects a pending voucher.
        VOUCHER_REDEEMED = (
            "VOUCHER_REDEEMED",
            "Voucher Redeemed",
        )  # When a voucher is successfully redeemed at a hospital.
        VOUCHER_EXPIRED = (
            "VOUCHER_EXPIRED",
            "Voucher Expired",
        )  # When a voucher reaches its expiry date without being redeemed.

    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    voucher = models.ForeignKey(
        Voucher, on_delete=models.CASCADE, related_name="notifications"
    )
    campaign = models.ForeignKey(
        Campaign,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="voucher_notifications",
    )
    donor = models.ForeignKey(
        Donor,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="voucher_notifications",
    )
    moment = models.CharField(max_length=20, choices=NOTIFICATION_MOMENT.choices)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Notification for Voucher {self.voucher.voucher_code} - {self.moment}"

    class Meta:
        indexes = [
            models.Index(fields=["moment"]),
            models.Index(fields=["is_read"]),
            models.Index(fields=["created_at"]),
        ]
