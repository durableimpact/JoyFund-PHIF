"""
Celery tasks for ANC tracking system.
Handles async operations like certificate generation and notifications.
"""
from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings
from datetime import datetime, timedelta
import logging
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib import colors
import io

from .models import ANCEnrollment, ANCCompletionCertificate, MissedAppointmentAlert
from accounts.models import SocialWorker

logger = logging.getLogger(__name__)


@shared_task
def generate_completion_certificate(enrollment_id):
    """
    Generate PDF certificate when ANC enrollment is completed.
    Creates certificate file and sends notification.
    """
    try:
        enrollment = ANCEnrollment.objects.get(id=enrollment_id)
    except ANCEnrollment.DoesNotExist:
        logger.error(f"Enrollment {enrollment_id} not found")
        return
    
    try:
        # Check if certificate already exists
        if hasattr(enrollment, 'completion_certificate'):
            logger.warning(f"Certificate already exists for enrollment {enrollment_id}")
            return
        
        # Generate certificate number
        certificate = ANCCompletionCertificate.objects.create(
            enrollment=enrollment,
            status=ANCCompletionCertificate.CertificateStatus.PENDING,
            generated_by=enrollment.social_worker,
            completion_date=enrollment.completion_date or enrollment.updated_at.date(),
        )
        certificate.generate_certificate_number()
        
        # Create PDF
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter, topMargin=0.5*inch, bottomMargin=0.5*inch)
        elements = []
        styles = getSampleStyleSheet()
        
        # Title
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#003366'),
            spaceAfter=12,
            alignment=1,
        )
        elements.append(Paragraph("ANTENATAL CARE COMPLETION CERTIFICATE", title_style))
        elements.append(Spacer(1, 0.3*inch))
        
        # Decorative line
        elements.append(Spacer(1, 0.1*inch))
        
        # Certificate body
        body_style = ParagraphStyle(
            'CustomBody',
            parent=styles['Normal'],
            fontSize=11,
            alignment=1,
            spaceAfter=12,
        )
        
        elements.append(Paragraph(
            f"This certifies that <b>{enrollment.beneficiary.full_name}</b>",
            body_style
        ))
        elements.append(Paragraph(
            f"(Digital Health ID: {enrollment.beneficiary.digital_health_id})",
            body_style
        ))
        elements.append(Spacer(1, 0.2*inch))
        
        elements.append(Paragraph(
            "Has successfully completed all four (4) recommended Antenatal Care (ANC) visits:",
            body_style
        ))
        elements.append(Spacer(1, 0.2*inch))
        
        # Visits table
        visits_data = [['Visit', 'Planned Week', 'Status']]
        for visit in enrollment.visits.all().order_by('visit_number'):
            visits_data.append([
                f"Visit {visit.visit_number}",
                visit.get_visit_number_display().split('(')[1].strip(')'),
                visit.get_status_display(),
            ])
        
        visits_table = Table(visits_data, colWidths=[1.5*inch, 2*inch, 1.5*inch])
        visits_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#003366')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 11),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#003366')),
        ]))
        elements.append(visits_table)
        elements.append(Spacer(1, 0.3*inch))
        
        # Details
        details_style = ParagraphStyle(
            'Details',
            parent=styles['Normal'],
            fontSize=10,
            alignment=0,
        )
        
        elements.append(Paragraph(
            f"<b>Program Details:</b>",
            details_style
        ))
        elements.append(Paragraph(
            f"Enrollment Date: {enrollment.enrollment_date.strftime('%B %d, %Y')}",
            details_style
        ))
        elements.append(Paragraph(
            f"Completion Date: {enrollment.completion_date.strftime('%B %d, %Y')}",
            details_style
        ))
        elements.append(Paragraph(
            f"Expected Delivery: {enrollment.expected_delivery_date.strftime('%B %d, %Y')}",
            details_style
        ))
        elements.append(Spacer(1, 0.3*inch))
        
        # Footer
        footer_style = ParagraphStyle(
            'Footer',
            parent=styles['Normal'],
            fontSize=9,
            alignment=1,
            textColor=colors.HexColor('#666666'),
        )
        elements.append(Paragraph(
            f"Certificate Number: {certificate.certificate_number}",
            footer_style
        ))
        elements.append(Paragraph(
            f"Generated: {datetime.now().strftime('%B %d, %Y at %H:%M')}",
            footer_style
        ))
        elements.append(Paragraph(
            "This certificate ensures complete antenatal care coverage for safe pregnancy and delivery.",
            footer_style
        ))
        
        # Build PDF
        doc.build(elements)
        buffer.seek(0)
        
        # Save to certificate
        from django.core.files.base import ContentFile
        filename = f"anc_certificate_{certificate.certificate_number}.pdf"
        certificate.certificate_file.save(filename, ContentFile(buffer.getvalue()), save=True)
        
        # Update status
        certificate.status = ANCCompletionCertificate.CertificateStatus.GENERATED
        certificate.save()
        
        logger.info(f"Certificate generated for enrollment {enrollment_id}")
        
        # Send notification
        send_certificate_notification.delay(certificate.id)
        
    except Exception as e:
        logger.error(f"Error generating certificate for enrollment {enrollment_id}: {str(e)}")


@shared_task
def send_certificate_notification(certificate_id):
    """
    Send email notification to social worker that certificate is ready.
    """
    try:
        certificate = ANCCompletionCertificate.objects.get(id=certificate_id)
    except ANCCompletionCertificate.DoesNotExist:
        logger.error(f"Certificate {certificate_id} not found")
        return
    
    try:
        social_worker = certificate.enrollment.social_worker
        if not social_worker or not social_worker.user:
            logger.warning(f"No social worker for certificate {certificate_id}")
            return
        
        subject = f"ANC Completion Certificate Ready - {certificate.enrollment.beneficiary.full_name}"
        body = f"""
Dear {social_worker.user.get_full_name() or social_worker.user.email},

The Antenatal Care (ANC) completion certificate has been generated for:

Beneficiary: {certificate.enrollment.beneficiary.full_name}
Digital Health ID: {certificate.enrollment.beneficiary.digital_health_id}
Certificate Number: {certificate.certificate_number}

The certificate is ready for printing and issuance to the beneficiary.

Best regards,
JoyFund PHIF System
"""
        
        send_mail(
            subject,
            body,
            settings.DEFAULT_FROM_EMAIL,
            [social_worker.user.email],
            fail_silently=True,
        )
        
        logger.info(f"Certificate notification sent for {certificate_id}")
        
    except Exception as e:
        logger.error(f"Error sending certificate notification: {str(e)}")


@shared_task
def send_missed_appointment_notification(alert_id):
    """
    Send notification to social worker about missed appointment.
    Triggers follow-up reminder.
    """
    try:
        alert = MissedAppointmentAlert.objects.get(id=alert_id)
    except MissedAppointmentAlert.DoesNotExist:
        logger.error(f"Alert {alert_id} not found")
        return
    
    try:
        social_worker = alert.enrollment.social_worker
        beneficiary = alert.enrollment.beneficiary
        
        if not social_worker or not social_worker.user:
            logger.warning(f"No social worker for alert {alert_id}")
            return
        
        subject = f"MISSED ANC APPOINTMENT - Action Required: {beneficiary.full_name}"
        body = f"""
ALERT: Missed Appointment

Beneficiary: {beneficiary.full_name}
Digital Health ID: {beneficiary.digital_health_id}
Phone: {beneficiary.phone}

Visit: ANC Visit {alert.visit.visit_number}
Scheduled Date: {alert.visit.scheduled_date.strftime('%B %d, %Y')}
Missed Date: {alert.missed_date.strftime('%B %d, %Y')}

REQUIRED ACTION:
1. Contact beneficiary to understand reason for missing appointment
2. Reschedule visit at earliest convenience
3. Document follow-up attempts in the system

Please treat as priority - ensure beneficiary receives complete ANC care.

Best regards,
JoyFund PHIF System
"""
        
        send_mail(
            subject,
            body,
            settings.DEFAULT_FROM_EMAIL,
            [social_worker.user.email],
            fail_silently=True,
        )
        
        logger.info(f"Missed appointment notification sent for alert {alert_id}")
        
    except Exception as e:
        logger.error(f"Error sending missed appointment notification: {str(e)}")


@shared_task
def cleanup_expired_alerts():
    """
    Periodic task to mark very old missed alerts as dismissed if unresolved.
    Should be scheduled to run weekly.
    """
    try:
        cutoff_date = datetime.today().date() - timedelta(days=30)
        
        expired_alerts = MissedAppointmentAlert.objects.filter(
            status=MissedAppointmentAlert.AlertStatus.ACTIVE,
            missed_date__lt=cutoff_date,
        )
        
        count = expired_alerts.update(status=MissedAppointmentAlert.AlertStatus.DISMISSED)
        logger.info(f"Dismissed {count} expired alerts")
        
    except Exception as e:
        logger.error(f"Error cleaning up expired alerts: {str(e)}")


@shared_task
def send_visit_reminder(visit_id):
    """
    Send reminder (SMS/Email) to beneficiary about upcoming ANC visit.
    """
    try:
        visit = ANCVisit.objects.get(id=visit_id)
        beneficiary = visit.enrollment.beneficiary
        
        # Log the reminder for now (SMS integration would go here)
        logger.info(f"Reminder sent for visit {visit_id} to {beneficiary.full_name}")
        
    except ANCVisit.DoesNotExist:
        logger.error(f"Visit {visit_id} not found")
    except Exception as e:
        logger.error(f"Error sending visit reminder: {str(e)}")

