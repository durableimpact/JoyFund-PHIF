from .hospital import Hospital
from vouchers.models import Voucher
from django.db import models
from utils.models import BaseEvent
from accounts.models import Receptionist, SystemAdmin


class ClaimStatus(models.TextChoices):
    # Claim has been submitted but not yet reviewed by hospital staff.
    PENDING = "PENDING", "Pending Review"
    # Hospital staff have approved the claim amount.
    APPROVED = "APPROVED", "Approved"
    # Hospital staff have rejected the claim.
    REJECTED = "REJECTED", "Rejected"


class MedicalClaim(models.Model):

    voucher = models.OneToOneField(
        Voucher, on_delete=models.CASCADE, related_name="medical_claim"
    )
    hospital = models.ForeignKey(
        Hospital, on_delete=models.SET_NULL, null=True, related_name="medical_claims"
    )
    service_description = models.TextField(blank=True)
    total_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    claim_status = models.CharField(
        max_length=20, default="PENDING", choices=ClaimStatus
    )  # PENDING, APPROVED, REJECTED
    submitted_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    service_completed_at = models.DateTimeField(
        null=True, blank=True, help_text="When receptionist marked service as complete"
    )
    submitted_by = models.ForeignKey(
        Receptionist,
        on_delete=models.SET_NULL,
        null=True,
        related_name="submitted_claims",
    )
    reviewed_by = models.ForeignKey(
        SystemAdmin,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reviewed_claims",
    )
    rejection_reason = models.TextField(
        blank=True, null=True, help_text="Reason for claim rejection by admin"
    )

    class Meta:

        indexes = [
            models.Index(fields=["claim_status"]),
            models.Index(fields=["submitted_at"]),
            models.Index(fields=["hospital"]),
        ]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._initial_claim_status = self.claim_status

    def save(self, *args, **kwargs):
        is_new = self._state.adding
        super().save(*args, **kwargs)

        if is_new or self.claim_status != self._initial_claim_status:
            if is_new:
                notes = f"MedicalClaim status initially set to {self.claim_status}"
            else:
                notes = f"MedicalClaim status changed from {self._initial_claim_status} to {self.claim_status}"
            self.events.create(
                status=self.claim_status,
                notes=notes
            )
            self._initial_claim_status = self.claim_status

    def __str__(self):
        return f"Claim for Voucher {self.voucher.id} at {self.hospital.name if self.hospital else 'Unknown Hospital'}"


class ClaimItem(models.Model):
    medical_claim = models.ForeignKey(
        MedicalClaim, on_delete=models.CASCADE, related_name="claim_items"
    )
    name = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"Claim Item: {self.name} - {self.amount}"


class DocumentType(models.TextChoices):
    BILL = "BILL", "Hospital Bill"
    PRESCRIPTION = "PRESCRIPTION", "Prescription"
    LAB_RESULT = "LAB_RESULT", "Lab Result"
    DISCHARGE = "DISCHARGE", "Discharge Summary"
    IMAGING = "IMAGING", "Imaging (X-ray, Scan)"
    OTHER = "OTHER", "Other"


class VerificationStatus(models.TextChoices):
    PENDING = "PENDING", "Pending Verification"
    VERIFIED = "VERIFIED", "Verified"
    REJECTED = "REJECTED", "Rejected"
    FLAGGED = "FLAGGED", "Flagged for Review"


class MedicalClaimProof(models.Model):

    medical_claim = models.ForeignKey(
        MedicalClaim, on_delete=models.CASCADE, related_name="proofs"
    )
    file = models.FileField(upload_to="claims/proofs/")
    document_type = models.CharField(max_length=20, choices=DocumentType.choices)

    uploaded_by = models.ForeignKey(
        Receptionist,
        on_delete=models.SET_NULL,
        null=True,
        related_name="uploaded_claim_documents",
    )
    verification_status = models.CharField(
        max_length=20,
        choices=VerificationStatus.choices,
        default=VerificationStatus.PENDING,
    )
    verified_by = models.ForeignKey(
        SystemAdmin,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="verified_claim_documents",
    )
    verified_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True, null=True)

    uploaded_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=["document_type"]),
            models.Index(fields=["verification_status"]),
            models.Index(fields=["uploaded_at"]),
        ]

    def __str__(self):
        return f"Document for Claim {self.medical_claim.id}"


class MedicalClaimEvent(BaseEvent):
    """
    Tracks all the status changes that happen on a MedicalClaim
    """
    medical_claim = models.ForeignKey(
        MedicalClaim, 
        on_delete=models.CASCADE, 
        related_name="events"
    )


class MedicalClaimProofEvent(BaseEvent):
    """
    Tracks all the verification_status changes that happen on a MedicalClaimProof
    """
    medical_claim_proof = models.ForeignKey(
        MedicalClaimProof, 
        on_delete=models.CASCADE, 
        related_name="events"
    )

