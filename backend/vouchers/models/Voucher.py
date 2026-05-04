from django.db import models
from django.conf import settings
from django.utils import timezone
from datetime import timedelta, date
import uuid
import random
import string
from beneficiaries.models import HealthIssue

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _generate_voucher_code():
    """
    Generates a unique 6-character alphanumeric voucher code.
    e.g. X9K3L2
    """
    for _ in range(200):
        candidate = "".join(random.choices(string.ascii_uppercase + string.digits, k=6))
        if not Voucher.objects.filter(voucher_code=candidate).exists():
            return candidate
    # Fallback — virtually impossible to reach
    return f"{uuid.uuid4().hex[:6].upper()}"


def _generate_patient_otp():
    """Generates a random 4-digit OTP."""
    return "".join(random.choices(string.digits, k=4))


class Voucher(models.Model):

    class Status(models.TextChoices):
        ACTIVE = "ACTIVE", "Active"  # Voucher is active and can be redeemed.
        USED = "USED", "Used"  # Voucher has been redeemed.
        EXPIRED = "EXPIRED", "Expired"  # Voucher has passed its expiry date

    class Language(models.TextChoices):
        FRENCH = "fr", "French"  # Send beneficiary SMS in French.
        ENGLISH = "en", "English"  # Send beneficiary SMS in English.
        LOCAL = (
            "local",
            "Local Dialect",
        )  # Send beneficiary SMS in configured local dialect template.

    # --- Core identity ---
    voucher_code = models.CharField(max_length=12, unique=True, editable=False)

    # --- Relationships ---
    beneficiary = models.ForeignKey(
        "beneficiaries.Beneficiary", on_delete=models.CASCADE
    )
    health_issue = models.ForeignKey(
        HealthIssue, on_delete=models.SET_NULL, null=True, blank=True
    )
    hospital = models.ForeignKey(
        "hospitals.Hospital", on_delete=models.SET_NULL, null=True
    )

    # --- Status & language ---
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.ACTIVE, db_index=True
    )
    language_preference = models.CharField(
        max_length=10, choices=Language.choices, default=Language.FRENCH
    )

    # --- Expiry management (30-day window) ---
    expiry_date = models.DateField(null=True, blank=True)
    reminder_20_sent = models.BooleanField(default=False)
    reminder_28_sent = models.BooleanField(default=False)

    # --- Anti-fraud ---
    patient_confirmation_pin = models.CharField(
        max_length=4,
        blank=True,
        help_text="4-digit PIN provided by the mother to confirm service completion.",
    )
    # --- Timestamps ---
    created_at = models.DateTimeField(auto_now_add=True)
    locked_at = models.DateTimeField(null=True, blank=True)
    redeemed_at = models.DateTimeField(null=True, blank=True)
    expired_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=["voucher_code"]),
            models.Index(fields=["status"]),
            models.Index(fields=["beneficiary", "status"]),
            models.Index(fields=["hospital"]),
        ]

    def save(self, *args, **kwargs):
        if not self.voucher_code:
            self.voucher_code = _generate_voucher_code()

        # Generate a 4-digit PIN ONLY when the hospital marks the service as completed (PENDING_CONFIRMATION)
        if (
            self.status == self.Status.PENDING_CONFIRMATION
            and not self.patient_confirmation_pin
        ):
            self.patient_confirmation_pin = _generate_patient_otp()

        # Set 30-day expiry when voucher becomes AVAILABLE
        if not self.expiry_date and self.status == self.Status.AVAILABLE:
            self.expiry_date = date.today() + timedelta(days=30)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.voucher_code} — {self.beneficiary.full_name}"
