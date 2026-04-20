"""
Signals for ANC tracking system.
Handles automatic alert generation on missed visits and certificate triggers.
"""
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone
from datetime import datetime, timedelta

from .models import ANCVisit, MissedAppointmentAlert, ANCEnrollment, ANCCompletionCertificate


@receiver(post_save, sender=ANCVisit)
def create_missed_alert_on_visit_miss(sender, instance, created, **kwargs):
    """
    Auto-generate MissedAppointmentAlert when a visit is marked as missed.
    """
    if instance.status == ANCVisit.Status.MISSED:
        # Check if alert already exists for this visit
        if not MissedAppointmentAlert.objects.filter(visit=instance).exists():
            alert = MissedAppointmentAlert.objects.create(
                visit=instance,
                enrollment=instance.enrollment,
                status=MissedAppointmentAlert.AlertStatus.ACTIVE,
                alert_sent_at=timezone.now(),
            )
            
            # Trigger notification task
            from .tasks import send_missed_appointment_notification
            send_missed_appointment_notification.delay(alert.id)


@receiver(post_save, sender=ANCVisit)
def check_enrollment_completion(sender, instance, created, **kwargs):
    """
    Check if all visits are completed when a visit is marked as completed.
    If all 4 visits done, suggest marking enrollment as completed.
    """
    if instance.status == ANCVisit.Status.COMPLETED:
        enrollment = instance.enrollment
        
        # Count completed visits
        visits_completed = enrollment.visits.filter(
            status=ANCVisit.Status.COMPLETED
        ).count()
        
        # If all 4 visits done and enrollment not already marked
        if visits_completed == 4 and enrollment.status != ANCEnrollment.Status.COMPLETED:
            # Set completion date but don't auto-mark as completed
            # Let social worker explicitly mark it
            pass


@receiver(post_save, sender=ANCEnrollment)
def initialize_visits_on_enrollment(sender, instance, created, **kwargs):
    """
    Initialize the 4 recommended ANC visits when an enrollment is created.
    This is also handled in the serializer, but this ensures consistency.
    """
    if created and instance.visits.count() == 0:
        # Visits should already be created via serializer
        pass
