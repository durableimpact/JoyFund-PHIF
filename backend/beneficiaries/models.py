from django.db import models
from django.conf import settings
from accounts.models import SocialWorker
import uuid
import random
import decimal
from datetime import date


# ---------------------------------------------------------------------------
# Enumerations
# ---------------------------------------------------------------------------

class Gender(models.TextChoices):
    MALE = 'MALE', 'Male'  # Identifies male beneficiaries.
    FEMALE = 'FEMALE', 'Female'  # Identifies female beneficiaries.
    OTHER = 'OTHER', 'Other'  # For non-binary/unspecified gender identity.


class BeneficiaryCategory(models.TextChoices):
    MATERNAL = 'MATERNAL', 'Pregnant Woman'  # Maternal health beneficiary.
    ELDERLY = 'ELDERLY', 'Elderly'  # Elderly care beneficiary.
    OTHER = 'OTHER', 'Other'  # Any beneficiary type not in predefined groups.


class UrgencyLevel(models.TextChoices):
    ROUTINE = 'ROUTINE', 'Routine'  # Standard case with no immediate danger.
    URGENT = 'URGENT', 'Urgent'  # Needs prompt attention but not immediately life-threatening.
    CRITICAL = 'CRITICAL', 'Critical'  # Severe case requiring immediate intervention.


class GeographicRemoteness(models.TextChoices):
    LOW = 'LOW', 'Low (Urban / Easy Access)'  # Urban/easy-access area.
    MEDIUM = 'MEDIUM', 'Medium (Peri-urban)'  # Peri-urban/moderate access area.
    HIGH = 'HIGH', 'High (Rural / Remote)'  # Rural/remote area with difficult access.


# ---------------------------------------------------------------------------
# Beneficiary
# ---------------------------------------------------------------------------

class Beneficiary(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # Unique human-readable Digital Health ID, e.g. BEN-0042
    digital_health_id = models.CharField(max_length=20, unique=True, editable=False, null=True, blank=True)

    full_name = models.CharField(max_length=255)
    date_of_birth = models.DateField()
    gender = models.CharField(max_length=20, choices=Gender.choices, default=Gender.OTHER)
    category = models.CharField(
        max_length=20, choices=BeneficiaryCategory.choices, default=BeneficiaryCategory.OTHER
    )

    # Urgency & geography — feed into WaitingPoolEntry scoring
    urgency_level = models.CharField(
        max_length=10, choices=UrgencyLevel.choices, default=UrgencyLevel.ROUTINE
    )
    geographic_remoteness = models.CharField(
        max_length=10, choices=GeographicRemoteness.choices, default=GeographicRemoteness.LOW
    )

    phone = models.CharField(max_length=15)
    email = models.EmailField(null=True, blank=True)

    # Preferred language for SMS delivery (ISO 639-1)
    language_preference = models.CharField(
        max_length=20, default='fr',
        help_text='ISO 639-1 code used for SMS dispatch, e.g. fr, en',
    )

    region = models.CharField(max_length=100)
    city = models.CharField(max_length=100)
    address = models.TextField()

    national_id_number = models.CharField(max_length=100, unique=True)

    # Supporting document: ID card, community attestation, or hospital referral
    supporting_document = models.FileField(
        upload_to='beneficiaries/documents/', null=True, blank=True,
        help_text='ID card, community attestation, or hospital referral letter',
    )

    emergency_contact_name = models.CharField(max_length=255)
    emergency_contact_phone = models.CharField(max_length=20)
    emergency_contact_relationship = models.CharField(max_length=100)

    chronic_conditions = models.TextField(null=True, blank=True)
    expected_delivery_date = models.DateField(null=True, blank=True)

    # Financial context
    income_description = models.TextField(
        null=True, blank=True,
        help_text='Brief description of household income / financial situation',
    )
    income_verified = models.BooleanField(default=False)

    enrolled_by = models.ForeignKey(
        SocialWorker, on_delete=models.CASCADE, related_name='beneficiaries'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.digital_health_id:
            # Generate a unique ID like BEN-0001, BEN-0002, etc.
            last_beneficiary = Beneficiary.objects.all().order_by('id').last()
            if last_beneficiary and last_beneficiary.digital_health_id:
                try:
                    last_id_num = int(last_beneficiary.digital_health_id.split('-')[1])
                    new_id_num = last_id_num + 1
                except (IndexError, ValueError):
                    # Fallback if parsing fails
                    new_id_num = Beneficiary.objects.count() + 1
            else:
                new_id_num = 1
            
            self.digital_health_id = f"BEN-{new_id_num:04d}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.full_name} ({self.digital_health_id})"


# ---------------------------------------------------------------------------
# Waiting Pool
# ---------------------------------------------------------------------------

class WaitingPoolStatus(models.TextChoices):
    ACTIVE = 'ACTIVE', 'Active — Awaiting Funds'  # In queue and waiting to be matched with funds.
    MATCHED = 'MATCHED', 'Matched — Pending Approval'  # Match found; waiting for admin checkpoint decision.
    FUNDED = 'FUNDED', 'Funded — Voucher Issued'  # Voucher has been issued to beneficiary.
    REMOVED = 'REMOVED', 'Removed'  # Temporarily or permanently removed from active waiting pool.


class WaitingPoolEntry(models.Model):
    """
    Represents a beneficiary's live slot in the prioritised waiting pool.

    Urgency score is a weighted composite recalculated daily:
      - Medical urgency       40 %
      - Gestational age       25 %
      - Geographic remoteness 20 %
      - Waiting time          15 %

    Range: 0–100.  Higher score = higher priority (acts like a triage system).
    """

    beneficiary = models.OneToOneField(
        Beneficiary,
        on_delete=models.CASCADE,
        related_name='waiting_pool_entry',
    )
    status = models.CharField(
        max_length=10, choices=WaitingPoolStatus.choices, default=WaitingPoolStatus.ACTIVE
    )

    # Score sub-components (0–100 each, stored for auditability)
    medical_urgency_score = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    gestational_age_score = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    geographic_score = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    waiting_time_score = models.DecimalField(max_digits=5, decimal_places=2, default=0)

    # Final weighted composite (persisted so the list can be ordered in SQL)
    final_score = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    score_updated_at = models.DateTimeField(auto_now=True)

    entered_at = models.DateTimeField(auto_now_add=True)
    matched_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ['-final_score']
        verbose_name = 'Waiting Pool Entry'
        verbose_name_plural = 'Waiting Pool Entries'

    def __str__(self):
        return f"{self.beneficiary.digital_health_id} — Score: {self.final_score}"

    # ------------------------------------------------------------------
    # Score computation (called by a daily management command / Celery beat)
    # ------------------------------------------------------------------
    def compute_scores(self):
        """Recalculates all sub-scores and final_score, then saves."""
        from django.utils import timezone

        # --- Medical urgency (40%) ---
        medical_map = {
            UrgencyLevel.CRITICAL: decimal.Decimal('100'),
            UrgencyLevel.URGENT: decimal.Decimal('60'),
            UrgencyLevel.ROUTINE: decimal.Decimal('20'),
        }
        med_score = medical_map.get(
            self.beneficiary.urgency_level, decimal.Decimal('20')
        )

        # --- Gestational age (25%): closer to delivery = higher score ---
        gest_score = decimal.Decimal('0')
        if self.beneficiary.expected_delivery_date:
            days_remaining = (self.beneficiary.expected_delivery_date - date.today()).days
            if days_remaining <= 0:
                gest_score = decimal.Decimal('100')
            elif days_remaining <= 30:
                gest_score = decimal.Decimal('90')
            elif days_remaining <= 60:
                gest_score = decimal.Decimal('70')
            elif days_remaining <= 90:
                gest_score = decimal.Decimal('50')
            else:
                gest_score = decimal.Decimal('20')

        # --- Geographic remoteness (20%) ---
        geo_map = {
            GeographicRemoteness.HIGH: decimal.Decimal('100'),
            GeographicRemoteness.MEDIUM: decimal.Decimal('60'),
            GeographicRemoteness.LOW: decimal.Decimal('20'),
        }
        geo_score = geo_map.get(
            self.beneficiary.geographic_remoteness, decimal.Decimal('20')
        )

        # --- Waiting time (15%): ~0.7 points per day, capped at 100 ---
        days_waiting = (timezone.now().date() - self.entered_at.date()).days
        wait_score = min(
            decimal.Decimal(days_waiting) * decimal.Decimal('0.7'),
            decimal.Decimal('100'),
        )

        self.medical_urgency_score = med_score
        self.gestational_age_score = gest_score
        self.geographic_score = geo_score
        self.waiting_time_score = wait_score

        self.final_score = (
            med_score * decimal.Decimal('0.40')
            + gest_score * decimal.Decimal('0.25')
            + geo_score * decimal.Decimal('0.20')
            + wait_score * decimal.Decimal('0.15')
        ).quantize(decimal.Decimal('0.01'))

        self.save()
