"""
Models for Antenatal Care (ANC) tracking and attendance management.

User Story: As a Social Worker, I want to track ANC attendance for my enrolled 
beneficiaries so that we ensure complete care.

Acceptance Criteria:
- Dashboard showing enrolled beneficiaries
- ANC visit tracking (4 recommended visits)
- Missed appointment alerts
- Completion certificates
"""
from django.db import models
from django.utils import timezone
from django.core.validators import MinValueValidator, MaxValueValidator
from beneficiaries.models import Beneficiary
from accounts.models import SocialWorker
import uuid


class ANCEnrollment(models.Model):
    """
    Tracks a beneficiary's enrollment in ANC program.
    One per pregnant beneficiary per pregnancy.
    """
    
    class Status(models.TextChoices):
        ACTIVE = 'ACTIVE', 'Active'  # Participating in ANC program
        COMPLETED = 'COMPLETED', 'Completed'  # All visits done, ready for delivery
        DROPPED_OUT = 'DROPPED_OUT', 'Dropped Out'  # Stopped attending
        DELIVERED = 'DELIVERED', 'Delivered'  # Already given birth
        
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    beneficiary = models.ForeignKey(
        Beneficiary,
        on_delete=models.CASCADE,
        related_name='anc_enrollments'
    )
    social_worker = models.ForeignKey(
        SocialWorker,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='anc_enrollments'
    )
    
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.ACTIVE
    )
    
    # Pregnancy details
    gestational_age_at_enrollment = models.PositiveIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(40)],
        help_text="Weeks of pregnancy at enrollment"
    )
    expected_delivery_date = models.DateField()
    
    # Program timeline
    enrollment_date = models.DateField(auto_now_add=True)
    completion_date = models.DateField(
        null=True,
        blank=True,
        help_text="Date all recommended visits were completed"
    )
    delivery_date = models.DateField(
        null=True,
        blank=True,
        help_text="Actual delivery date if known"
    )
    
    # Additional info
    high_risk = models.BooleanField(
        default=False,
        help_text="Flagged as high-risk pregnancy"
    )
    notes = models.TextField(
        blank=True,
        help_text="Clinical notes or special considerations"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-enrollment_date']
        indexes = [
            models.Index(fields=['beneficiary', 'status']),
            models.Index(fields=['social_worker', 'status']),
            models.Index(fields=['status']),
        ]
    
    def __str__(self):
        return f"ANC: {self.beneficiary.full_name} ({self.get_status_display()})"
    
    @property
    def visits_completed(self):
        """Count of completed ANC visits."""
        return self.visits.filter(status=ANCVisit.Status.COMPLETED).count()
    
    @property
    def visits_scheduled(self):
        """Count of scheduled ANC visits."""
        return self.visits.filter(status=ANCVisit.Status.SCHEDULED).count()
    
    @property
    def visits_missed(self):
        """Count of missed ANC visits."""
        return self.visits.filter(status=ANCVisit.Status.MISSED).count()
    
    @property
    def completion_percentage(self):
        """Calculate percentage of recommended visits completed."""
        total_recommended = 4  # Standard ANC protocol
        completed = self.visits_completed
        return round((completed / total_recommended) * 100) if total_recommended > 0 else 0


class ANCVisit(models.Model):
    """
    Records individual ANC visit appointments and outcomes.
    Tracks 4 recommended visits: 1st (<=12 weeks), 2nd (20 weeks), 
    3rd (30 weeks), 4th (36 weeks).
    """
    
    class Status(models.TextChoices):
        SCHEDULED = 'SCHEDULED', 'Scheduled'  # Appointment booked
        COMPLETED = 'COMPLETED', 'Completed'  # Successfully attended
        MISSED = 'MISSED', 'Missed'  # Did not attend
        RESCHEDULED = 'RESCHEDULED', 'Rescheduled'  # Appointment moved
        CANCELLED = 'CANCELLED', 'Cancelled'  # Officially cancelled
    
    class VisitNumber(models.IntegerChoices):
        FIRST = 1, 'First Visit (≤12 weeks)'
        SECOND = 2, 'Second Visit (20 weeks)'
        THIRD = 3, 'Third Visit (30 weeks)'
        FOURTH = 4, 'Fourth Visit (36 weeks)'
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    enrollment = models.ForeignKey(
        ANCEnrollment,
        on_delete=models.CASCADE,
        related_name='visits'
    )
    
    # Visit sequence
    visit_number = models.PositiveIntegerField(choices=VisitNumber.choices)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.SCHEDULED
    )
    
    # Scheduling
    scheduled_date = models.DateField(
        help_text="Original scheduled date for this visit"
    )
    actual_date = models.DateField(
        null=True,
        blank=True,
        help_text="Date visit actually occurred"
    )
    
    # Visit details (if completed)
    weight_kg = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Weight in kilograms"
    )
    blood_pressure = models.CharField(
        max_length=20,
        blank=True,
        help_text="Format: 120/80 (systolic/diastolic)"
    )
    hemoglobin_level = models.DecimalField(
        max_digits=4,
        decimal_places=1,
        null=True,
        blank=True,
        help_text="Hemoglobin level in g/dL"
    )
    
    # Clinical observations
    clinical_notes = models.TextField(
        blank=True,
        help_text="Notes from healthcare provider"
    )
    complications_noted = models.BooleanField(
        default=False,
        help_text="Any complications detected"
    )
    
    # Referral info
    referred_to_hospital = models.BooleanField(
        default=False,
        help_text="Referred to hospital for further care"
    )
    referral_reason = models.TextField(
        blank=True,
        help_text="Reason for hospital referral if applicable"
    )
    
    # Tracking
    created_by = models.ForeignKey(
        SocialWorker,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='recorded_visits'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['visit_number', 'scheduled_date']
        unique_together = ('enrollment', 'visit_number')  # One visit per number per enrollment
        indexes = [
            models.Index(fields=['enrollment', 'status']),
            models.Index(fields=['status', 'scheduled_date']),
        ]
    
    def __str__(self):
        return f"Visit {self.visit_number}: {self.enrollment.beneficiary.full_name} ({self.get_status_display()})"
    
    def mark_completed(self, **kwargs):
        """Mark visit as completed with optional clinical data."""
        self.status = self.Status.COMPLETED
        self.actual_date = timezone.now().date()
        
        # Update weight, BP, hemoglobin if provided
        for field, value in kwargs.items():
            if hasattr(self, field) and value is not None:
                setattr(self, field, value)
        
        self.save()
    
    def mark_missed(self):
        """Mark visit as missed."""
        self.status = self.Status.MISSED
        self.save()


class MissedAppointmentAlert(models.Model):
    """
    Alerts generated when ANC appointments are missed.
    Triggers notifications and enables follow-up tracking.
    """
    
    class AlertStatus(models.TextChoices):
        ACTIVE = 'ACTIVE', 'Active'  # Alert is open
        RESOLVED = 'RESOLVED', 'Resolved'  # Follow-up completed
        DISMISSED = 'DISMISSED', 'Dismissed'  # Manually dismissed
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    visit = models.OneToOneField(
        ANCVisit,
        on_delete=models.CASCADE,
        related_name='missed_alert'
    )
    enrollment = models.ForeignKey(
        ANCEnrollment,
        on_delete=models.CASCADE,
        related_name='missed_alerts'
    )
    
    # Alert lifecycle
    status = models.CharField(
        max_length=20,
        choices=AlertStatus.choices,
        default=AlertStatus.ACTIVE
    )
    
    # Alert timing
    missed_date = models.DateField(  # Date appointment was missed
        auto_now_add=True
    )
    alert_sent_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When notification was sent to social worker"
    )
    follow_up_date = models.DateField(
        null=True,
        blank=True,
        help_text="When social worker plans to reach out"
    )
    resolved_date = models.DateField(
        null=True,
        blank=True,
        help_text="When issue was resolved"
    )
    
    # Follow-up information
    follow_up_notes = models.TextField(
        blank=True,
        help_text="Notes on follow-up attempts and responses"
    )
    rescheduled_visit = models.ForeignKey(
        ANCVisit,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='rescheduled_from_alert',
        help_text="New visit scheduled as a result of this alert"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-missed_date']
        indexes = [
            models.Index(fields=['enrollment', 'status']),
            models.Index(fields=['status', 'missed_date']),
        ]
    
    def __str__(self):
        return f"Missed Alert: {self.enrollment.beneficiary.full_name} (Visit {self.visit.visit_number})"


class ANCCompletionCertificate(models.Model):
    """
    Completion certificate generated when a beneficiary completes all 4 ANC visits.
    Can be exported as PDF for printing/sharing.
    """
    
    class CertificateStatus(models.TextChoices):
        PENDING = 'PENDING', 'Pending'  # Not yet generated
        GENERATED = 'GENERATED', 'Generated'  # Created and ready for download
        PRINTED = 'PRINTED', 'Printed'  # Physical copy printed
        ISSUED = 'ISSUED', 'Issued'  # Given to beneficiary
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    enrollment = models.OneToOneField(
        ANCEnrollment,
        on_delete=models.CASCADE,
        related_name='completion_certificate'
    )
    
    status = models.CharField(
        max_length=20,
        choices=CertificateStatus.choices,
        default=CertificateStatus.PENDING
    )
    
    # Certificate details
    certificate_number = models.CharField(
        max_length=50,
        unique=True,
    )
    issued_date = models.DateField(
        auto_now_add=True
    )
    completion_date = models.DateField(
        help_text="Date when all 4 visits were completed"
    )
    
    # Document
    certificate_file = models.FileField(
        upload_to='anc/certificates/',
        null=True,
        blank=True,
        help_text="PDF file of certificate"
    )
    
    # Tracking
    generated_by = models.ForeignKey(
        SocialWorker,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='generated_certificates'
    )
    issued_by = models.ForeignKey(
        SocialWorker,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='issued_certificates',
        help_text="Social worker who gave certificate to beneficiary"
    )
    issued_date_actual = models.DateField(
        null=True,
        blank=True,
        help_text="When certificate was actually given to beneficiary"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-issued_date']
        indexes = [
            models.Index(fields=['enrollment']),
            models.Index(fields=['status']),
        ]
    
    def __str__(self):
        return f"Certificate #{self.certificate_number} - {self.enrollment.beneficiary.full_name}"
    
    def generate_certificate_number(self):
        """Generate unique certificate number if not already set."""
        if not self.certificate_number:
            import datetime
            timestamp = datetime.datetime.now().strftime('%Y%m%d%H%M%S')
            self.certificate_number = f"ANC-CERT-{timestamp}"
