from django.db import models
from django.conf import settings
from django.utils import timezone
from datetime import timedelta, date
import uuid
import random
import string


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _generate_voucher_code():
    """
    Generates a unique 6-character alphanumeric voucher code.
    e.g. X9K3L2
    """
    for _ in range(200):
        candidate = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
        if not CareVoucher.objects.filter(voucher_code=candidate).exists():
            return candidate
    # Fallback — virtually impossible to reach
    return f"{uuid.uuid4().hex[:6].upper()}"

def _generate_patient_otp():
    """Generates a random 4-digit OTP."""
    return ''.join(random.choices(string.digits, k=4))


# ---------------------------------------------------------------------------
# Stage 3 — Matching & Admin Approval Checkpoint
# ---------------------------------------------------------------------------

class VoucherAssignment(models.Model):
    """
    Created by the matching engine when escrow funds are paired with the
    highest-priority beneficiary in the Waiting Pool.

    A human admin has 24 hours to approve/flag.  If no action is taken the
    system auto-approves so urgent cases are never blocked.
    """

    class Status(models.TextChoices):
        PENDING_APPROVAL = 'PENDING_APPROVAL', 'Pending Admin Approval'  # Matching done; waiting for human checkpoint.
        APPROVED = 'APPROVED', 'Approved'  # Approved by an authorized admin/social worker.
        AUTO_APPROVED = 'AUTO_APPROVED', 'Auto-Approved (24 h timeout)'  # Approved automatically after 24h timeout.
        FLAGGED = 'FLAGGED', 'Flagged — Requires Review'  # Suspicious or problematic match needing investigation.
        CANCELLED = 'CANCELLED', 'Cancelled'  # Assignment invalidated and not proceeding to voucher issuance.

    beneficiary = models.ForeignKey(
        'beneficiaries.Beneficiary',
        on_delete=models.CASCADE,
        related_name='assignments',
    )
    campaign = models.ForeignKey(
        'campaigns.Campaign',
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name='assignments',
    )
    hospital = models.ForeignKey(
        'hospitals.Hospital',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='assignments',
    )
    service = models.ForeignKey(
        'hospitals.Services',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='assignments',
    )
    matched_amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.PENDING_APPROVAL
    )

    # The admin / social worker who must confirm this match
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name='pending_approvals',
        help_text='Admin / social worker responsible for approving this match',
    )
    approval_deadline = models.DateTimeField(
        null=True, blank=True,
        help_text='Auto-approved if no action by this timestamp',
    )
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name='approved_assignments',
    )
    approved_at = models.DateTimeField(null=True, blank=True)
    flag_reason = models.TextField(blank=True)

    matched_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['beneficiary', 'status']),
            models.Index(fields=['campaign']),
        ]

    def save(self, *args, **kwargs):
        if not self.approval_deadline:
            self.approval_deadline = timezone.now() + timedelta(hours=24)
        super().save(*args, **kwargs)

    def __str__(self):
        return (
            f"Assignment for {self.beneficiary.digital_health_id}"
            f" — {self.get_status_display()}"
        )


# ---------------------------------------------------------------------------
# Stage 4 — Care Voucher (issued after approval)
# ---------------------------------------------------------------------------

class CareVoucher(models.Model):

    class Status(models.TextChoices):
        PENDING_APPROVAL = 'PENDING_APPROVAL', 'Pending Admin Approval'  # Voucher exists but not yet released to beneficiary.
        AVAILABLE = 'AVAILABLE', 'Available'  # Ready for beneficiary use within validity window.
        LOCKED = 'LOCKED', 'Checked-In at Hospital'  # Presented at facility; reserved for this visit.
        PENDING_CONFIRMATION = 'PENDING_CONFIRMATION', 'Pending Patient Confirmation'  # Service done; waiting for patient PIN.
        REDEEMED = 'REDEEMED', 'Care Completed'  # PIN verified and voucher consumed.
        EXPIRED = 'EXPIRED', 'Expired'  # Validity lapsed before use.

    class Language(models.TextChoices):
        FRENCH = 'fr', 'French'  # Send beneficiary SMS in French.
        ENGLISH = 'en', 'English'  # Send beneficiary SMS in English.
        LOCAL = 'local', 'Local Dialect'  # Send beneficiary SMS in configured local dialect template.

    # --- Core identity ---
    voucher_code = models.CharField(max_length=12, unique=True, editable=False)
    assignment = models.OneToOneField(
        VoucherAssignment,
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name='voucher',
    )

    # --- Relationships ---
    beneficiary = models.ForeignKey(
        'beneficiaries.Beneficiary', on_delete=models.CASCADE
    )
    campaign = models.ForeignKey(
        'campaigns.Campaign', null=True, blank=True, on_delete=models.SET_NULL
    )
    hospital = models.ForeignKey(
        'hospitals.Hospital', on_delete=models.SET_NULL, null=True
    )
    service = models.ForeignKey(
        'hospitals.Services', on_delete=models.SET_NULL, null=True, blank=True
    )

    # --- Financials ---
    value = models.DecimalField(max_digits=10, decimal_places=2)

    # --- Status & language ---
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.PENDING_APPROVAL
    )
    language_preference = models.CharField(
        max_length=10, choices=Language.choices, default=Language.FRENCH
    )

    # --- Expiry management (30-day window) ---
    expiry_date = models.DateField(null=True, blank=True)
    reminder_20_sent = models.BooleanField(default=False)
    reminder_28_sent = models.BooleanField(default=False)

    # --- Anti-fraud ---
    patient_confirmation_pin = models.CharField(max_length=4, blank=True, help_text="4-digit PIN provided by the mother to confirm service completion.")
    proof_of_service_image = models.ImageField(
        upload_to='vouchers/proofs/', null=True, blank=True
    )

    # --- Timestamps ---
    created_at = models.DateTimeField(auto_now_add=True)
    locked_at = models.DateTimeField(null=True, blank=True)
    redeemed_at = models.DateTimeField(null=True, blank=True)
    expired_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=['voucher_code']),
            models.Index(fields=['status']),
            models.Index(fields=['beneficiary', 'status']),
            models.Index(fields=['hospital']),
        ]

    def save(self, *args, **kwargs):
        if not self.voucher_code:
            self.voucher_code = _generate_voucher_code()
        
        # Generate a 4-digit PIN ONLY when the hospital marks the service as completed (PENDING_CONFIRMATION)
        if self.status == self.Status.PENDING_CONFIRMATION and not self.patient_confirmation_pin:
            self.patient_confirmation_pin = _generate_patient_otp()

        # Set 30-day expiry when voucher becomes AVAILABLE
        if not self.expiry_date and self.status == self.Status.AVAILABLE:
            self.expiry_date = date.today() + timedelta(days=30)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.voucher_code} — {self.beneficiary.full_name}"


# ---------------------------------------------------------------------------
# Stage 5 — Upgrade Requests
# ---------------------------------------------------------------------------

class UpgradeRequest(models.Model):
    """
    Filed by a social worker or hospital when a beneficiary's condition
    worsens after a voucher has been issued (e.g. routine ANC → C-section).
    The system checks for additional escrow funds; if insufficient it alerts an admin.
    """

    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending Review'  # Submitted and awaiting reviewer decision.
        APPROVED = 'APPROVED', 'Approved'  # Top-up/upgrade accepted.
        REJECTED = 'REJECTED', 'Rejected'  # Top-up/upgrade denied.

    voucher = models.ForeignKey(
        CareVoucher, on_delete=models.CASCADE, related_name='upgrade_requests'
    )
    requested_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='submitted_upgrade_requests',
    )
    original_service = models.ForeignKey(
        'hospitals.Services',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='original_in_upgrades',
    )
    requested_service = models.ForeignKey(
        'hospitals.Services',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='requested_in_upgrades',
    )
    reason = models.TextField()
    additional_amount_needed = models.DecimalField(
        max_digits=10, decimal_places=2, default=0
    )
    status = models.CharField(
        max_length=10, choices=Status.choices, default=Status.PENDING
    )

    requested_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='reviewed_upgrade_requests',
    )
    review_notes = models.TextField(blank=True)

    def __str__(self):
        return f"Upgrade for {self.voucher.voucher_code} — {self.get_status_display()}"


# ---------------------------------------------------------------------------
# Full Audit Trail
# ---------------------------------------------------------------------------

class VoucherAuditLog(models.Model):
    """
    Immutable audit trail.  Every state change on a CareVoucher — whether
    triggered by a human or the system — must append a log entry here.
    This is the transparency spine of the platform.
    """

    class Action(models.TextChoices):
        CREATED = 'CREATED', 'Voucher Created'  # Voucher row created in the system.
        MATCHED = 'MATCHED', 'Matched to Beneficiary'  # Funds matched to a beneficiary.
        PENDING_APPROVAL = 'PENDING_APPROVAL', 'Pending Admin Approval'  # Waiting for human checkpoint.
        APPROVED = 'APPROVED', 'Admin Approved'  # Explicitly approved by reviewer.
        AUTO_APPROVED = 'AUTO_APPROVED', 'Auto-Approved (24 h)'  # Auto-approval after deadline.
        FLAGGED = 'FLAGGED', 'Flagged by Admin'  # Reviewer flagged inconsistency/fraud risk.
        SMS_SENT = 'SMS_SENT', 'SMS Dispatched to Beneficiary'  # Voucher code SMS sent.
        SW_NOTIFIED = 'SW_NOTIFIED', 'Social Worker Notified'  # Assigned social worker notified.
        LOCKED = 'LOCKED', 'Checked-In at Hospital'  # Hospital check-in recorded.
        PENDING_CONFIRMATION = 'PENDING_CONFIRMATION', 'Service Done — Awaiting PIN'  # Service done, OTP sent.
        REDEEMED = 'REDEEMED', 'Care Completed & Redeemed'  # Service completed and voucher redeemed.
        REMINDER_SENT = 'REMINDER_SENT', 'Expiry Reminder Sent'  # Day-20/day-28 reminder sent.
        EXPIRED = 'EXPIRED', 'Voucher Expired'  # Voucher expired without redemption.
        RETURNED_TO_POOL = 'RETURNED_TO_POOL', 'Funds Returned — Beneficiary Re-queued'  # Funds returned and case put back in queue.
        UPGRADE_REQUESTED = 'UPGRADE_REQUESTED', 'Upgrade Request Submitted'  # Clinical upgrade requested.
        UPGRADE_APPROVED = 'UPGRADE_APPROVED', 'Upgrade Request Approved'  # Upgrade accepted and funded.
        UPGRADE_REJECTED = 'UPGRADE_REJECTED', 'Upgrade Request Rejected'  # Upgrade denied.

    voucher = models.ForeignKey(
        CareVoucher, on_delete=models.CASCADE, related_name='audit_logs'
    )
    action = models.CharField(max_length=30, choices=Action.choices)
    performed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True, blank=True,
        on_delete=models.SET_NULL,
        help_text='Null for system-triggered actions',
    )
    notes = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['timestamp']

    def __str__(self):
        return (
            f"{self.voucher.voucher_code}"
            f" — {self.get_action_display()}"
            f" @ {self.timestamp:%Y-%m-%d %H:%M}"
        )


# ---------------------------------------------------------------------------
# Hospital Payout (unchanged)
# ---------------------------------------------------------------------------

class HospitalPayout(models.Model):
    voucher = models.OneToOneField(CareVoucher, on_delete=models.CASCADE)
    hospital = models.ForeignKey('hospitals.Hospital', on_delete=models.CASCADE)
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2)
    momo_transaction_id = models.CharField(max_length=100)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Payout for {self.voucher.voucher_code} to {self.hospital.name}"
