from django.db import models
from accounts.models import Receptionist, SystemAdmin
from .medical_claim import MedicalClaim


class VoucherTopUpRequestStatus(models.TextChoices):
    PENDING = "PENDING", "Pending Admin Review"
    APPROVED = "APPROVED", "Approved"
    REJECTED = "REJECTED", "Rejected"


class VoucherTopUpRequest(models.Model):
    """Track receptionist requests for additional voucher funding."""

    medical_claim = models.ForeignKey(
        MedicalClaim,
        on_delete=models.CASCADE,
        related_name="top_up_requests",
    )
    requested_amount = models.DecimalField(max_digits=12, decimal_places=2)
    reason = models.TextField(help_text="Why additional funds are needed")
    status = models.CharField(
        max_length=20,
        choices=VoucherTopUpRequestStatus.choices,
        default=VoucherTopUpRequestStatus.PENDING,
    )
    created_by = models.ForeignKey(
        Receptionist,
        on_delete=models.SET_NULL,
        null=True,
        related_name="top_up_requests_created",
    )
    reviewed_by = models.ForeignKey(
        SystemAdmin,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="top_up_requests_reviewed",
    )
    review_notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=["status"]),
            models.Index(fields=["created_at"]),
            models.Index(fields=["medical_claim"]),
        ]

    def __str__(self):
        return f"TopUp Request {self.id}: {self.requested_amount} XAF for Claim {self.medical_claim.id}"
