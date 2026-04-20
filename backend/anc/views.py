"""
Views for ANC tracking system.
Social worker dashboard and beneficiary visit management.
"""
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Count
from django.utils import timezone
from datetime import datetime, timedelta

from .models import ANCEnrollment, ANCVisit, MissedAppointmentAlert, ANCCompletionCertificate
from .serializers import (
    ANCEnrollmentDetailSerializer,
    ANCEnrollmentListSerializer,
    ANCEnrollmentCreateSerializer,
    ANCVisitSerializer,
    MissedAppointmentAlertSerializer,
    ANCCompletionCertificateSerializer,
)
from accounts.utils.permissions import IsSocialWorker


class ANCEnrollmentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing ANC enrollments and viewing beneficiary dashboard.
    
    Endpoints:
    - GET /anc/enrollments/ - List all enrollments for social worker
    - POST /anc/enrollments/ - Enroll a new beneficiary
    - GET /anc/enrollments/{id}/ - View full enrollment details
    - GET /anc/enrollments/dashboard/summary/ - Dashboard summary
    - GET /anc/enrollments/{id}/mark_completed/ - Mark enrollment as completed
    """
    
    permission_classes = [IsAuthenticated, IsSocialWorker]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'high_risk']
    search_fields = ['beneficiary__full_name', 'beneficiary__digital_health_id', 'beneficiary__phone']
    ordering_fields = ['expected_delivery_date', 'enrollment_date']
    ordering = ['expected_delivery_date']
    
    def get_queryset(self):
        """Return enrollments for the authenticated social worker."""
        from accounts.models import SocialWorker
        
        try:
            social_worker = SocialWorker.objects.get(user=self.request.user)
            return ANCEnrollment.objects.filter(
                social_worker=social_worker
            ).prefetch_related('visits', 'missed_alerts', 'completion_certificate')
        except SocialWorker.DoesNotExist:
            return ANCEnrollment.objects.none()
    
    def get_serializer_class(self):
        """Use different serializers for different actions."""
        if self.action == 'create':
            return ANCEnrollmentCreateSerializer
        elif self.action == 'list':
            return ANCEnrollmentListSerializer
        return ANCEnrollmentDetailSerializer
    
    @action(detail=False, methods=['get'])
    def dashboard_summary(self, request):
        """
        Get social worker's ANC dashboard summary.
        
        Returns:
        - Total enrollments
        - Active enrollments
        - Completion stats
        - Missed appointments
        - High-risk cases
        """
        from accounts.models import SocialWorker
        
        try:
            social_worker = SocialWorker.objects.get(user=request.user)
        except SocialWorker.DoesNotExist:
            return Response(
                {'error': 'User is not a social worker'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        enrollments = ANCEnrollment.objects.filter(social_worker=social_worker)
        
        # Summary statistics
        total_enrollments = enrollments.count()
        active_enrollments = enrollments.filter(status=ANCEnrollment.Status.ACTIVE).count()
        completed_enrollments = enrollments.filter(status=ANCEnrollment.Status.COMPLETED).count()
        high_risk_count = enrollments.filter(high_risk=True).count()
        
        # Missed appointments
        missed_alerts_active = MissedAppointmentAlert.objects.filter(
            enrollment__social_worker=social_worker,
            status=MissedAppointmentAlert.AlertStatus.ACTIVE
        ).count()
        
        # Upcoming visits in next 7 days
        today = datetime.today().date()
        next_week = today + timedelta(days=7)
        upcoming_visits = ANCVisit.objects.filter(
            enrollment__social_worker=social_worker,
            status=ANCVisit.Status.SCHEDULED,
            scheduled_date__gte=today,
            scheduled_date__lte=next_week,
        ).count()
        
        # Completion certification status
        ready_for_certificate = enrollments.filter(
            status=ANCEnrollment.Status.COMPLETED
        ).exclude(completion_certificate__isnull=False).count()
        
        return Response({
            'total_enrollments': total_enrollments,
            'active_enrollments': active_enrollments,
            'completed_enrollments': completed_enrollments,
            'high_risk_count': high_risk_count,
            'missed_appointments_active': missed_alerts_active,
            'upcoming_visits_next_7_days': upcoming_visits,
            'ready_for_certificate': ready_for_certificate,
        })
    
    @action(detail=True, methods=['post'])
    def mark_completed(self, request, pk=None):
        """
        Mark enrollment as completed.
        Triggers certificate generation if all visits done.
        """
        enrollment = self.get_object()
        
        if enrollment.visits_completed < 4:
            return Response(
                {
                    'error': f'Cannot complete enrollment. Only {enrollment.visits_completed}/4 visits completed.',
                    'visits_completed': enrollment.visits_completed,
                    'visits_remaining': 4 - enrollment.visits_completed,
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        enrollment.status = ANCEnrollment.Status.COMPLETED
        enrollment.completion_date = timezone.now().date()
        enrollment.save()
        
        # Trigger certificate generation
        from .tasks import generate_completion_certificate
        generate_completion_certificate.delay(enrollment.id)
        
        return Response(
            {
                'message': 'Enrollment marked as completed',
                'enrollment': ANCEnrollmentDetailSerializer(enrollment).data,
            }
        )


class ANCVisitViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing individual ANC visits.
    
    Endpoints:
    - GET /anc/visits/ - List visits
    - POST /anc/visits/ - Create visit
    - GET /anc/visits/{id}/ - Get visit details
    - PATCH /anc/visits/{id}/ - Update visit
    - POST /anc/visits/{id}/mark_completed/ - Mark as completed
    - POST /anc/visits/{id}/mark_missed/ - Mark as missed
    """
    
    permission_classes = [IsAuthenticated, IsSocialWorker]
    serializer_class = ANCVisitSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status', 'enrollment__high_risk']
    ordering_fields = ['scheduled_date', 'visit_number']
    ordering = ['scheduled_date']
    
    def get_queryset(self):
        """Return visits for enrollments managed by this social worker."""
        from accounts.models import SocialWorker
        
        try:
            social_worker = SocialWorker.objects.get(user=self.request.user)
            return ANCVisit.objects.filter(
                enrollment__social_worker=social_worker
            ).select_related('enrollment', 'created_by')
        except SocialWorker.DoesNotExist:
            return ANCVisit.objects.none()
    
    @action(detail=True, methods=['post'])
    def mark_completed(self, request, pk=None):
        """
        Record visit as completed with clinical data.
        
        Body:
        {
            "weight_kg": 60.5,
            "blood_pressure": "120/80",
            "hemoglobin_level": 12.5,
            "clinical_notes": "Normal checkup",
            "complications_noted": false,
            "referred_to_hospital": false
        }
        """
        visit = self.get_object()
        data = request.data
        
        from accounts.models import SocialWorker
        social_worker = SocialWorker.objects.get(user=request.user)
        
        visit.status = ANCVisit.Status.COMPLETED
        visit.actual_date = timezone.now().date()
        visit.created_by = social_worker
        
        # Update clinical data if provided
        if 'weight_kg' in data:
            visit.weight_kg = data['weight_kg']
        if 'blood_pressure' in data:
            visit.blood_pressure = data['blood_pressure']
        if 'hemoglobin_level' in data:
            visit.hemoglobin_level = data['hemoglobin_level']
        if 'clinical_notes' in data:
            visit.clinical_notes = data['clinical_notes']
        if 'complications_noted' in data:
            visit.complications_noted = data['complications_noted']
        if 'referred_to_hospital' in data:
            visit.referred_to_hospital = data['referred_to_hospital']
        
        visit.save()
        
        return Response(
            {
                'message': 'Visit marked as completed',
                'visit': ANCVisitSerializer(visit).data,
            }
        )
    
    @action(detail=True, methods=['post'])
    def mark_missed(self, request, pk=None):
        """
        Record visit as missed.
        Automatically generates MissedAppointmentAlert.
        """
        visit = self.get_object()
        
        visit.status = ANCVisit.Status.MISSED
        visit.save()
        
        # Alert is generated via signal
        
        return Response(
            {
                'message': 'Visit marked as missed. Alert generated.',
                'visit': ANCVisitSerializer(visit).data,
            }
        )


class MissedAppointmentAlertViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for viewing and managing missed appointment alerts.
    
    Endpoints:
    - GET /anc/missed-alerts/ - List missed appointment alerts
    - GET /anc/missed-alerts/{id}/ - Get alert details
    - POST /anc/missed-alerts/{id}/resolve/ - Mark alert as resolved
    """
    
    permission_classes = [IsAuthenticated, IsSocialWorker]
    serializer_class = MissedAppointmentAlertSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status']
    ordering_fields = ['missed_date']
    ordering = ['-missed_date']
    
    def get_queryset(self):
        """Return alerts for this social worker's enrollments."""
        from accounts.models import SocialWorker
        
        try:
            social_worker = SocialWorker.objects.get(user=self.request.user)
            return MissedAppointmentAlert.objects.filter(
                enrollment__social_worker=social_worker
            ).select_related('visit', 'enrollment')
        except SocialWorker.DoesNotExist:
            return MissedAppointmentAlert.objects.none()
    
    @action(detail=True, methods=['post'])
    def resolve(self, request, pk=None):
        """
        Mark alert as resolved with follow-up notes.
        
        Body:
        {
            "follow_up_notes": "Beneficiary will attend rescheduled visit",
            "rescheduled_visit_id": "uuid-of-new-visit"  // optional
        }
        """
        alert = self.get_object()
        data = request.data
        
        alert.status = MissedAppointmentAlert.AlertStatus.RESOLVED
        alert.resolved_date = timezone.now().date()
        
        if 'follow_up_notes' in data:
            alert.follow_up_notes = data['follow_up_notes']
        
        if 'rescheduled_visit_id' in data:
            try:
                rescheduled = ANCVisit.objects.get(id=data['rescheduled_visit_id'])
                alert.rescheduled_visit = rescheduled
            except ANCVisit.DoesNotExist:
                pass
        
        alert.save()
        
        return Response(
            {
                'message': 'Alert resolved',
                'alert': MissedAppointmentAlertSerializer(alert).data,
            }
        )


class ANCCompletionCertificateViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for viewing and accessing completion certificates.
    
    Endpoints:
    - GET /anc/certificates/ - List certificates
    - GET /anc/certificates/{id}/ - Get certificate details
    - GET /anc/certificates/{id}/download/ - Download certificate PDF
    """
    
    permission_classes = [IsAuthenticated, IsSocialWorker]
    serializer_class = ANCCompletionCertificateSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status']
    ordering_fields = ['issued_date']
    ordering = ['-issued_date']
    
    def get_queryset(self):
        """Return certificates for this social worker's enrollments."""
        from accounts.models import SocialWorker
        
        try:
            social_worker = SocialWorker.objects.get(user=self.request.user)
            return ANCCompletionCertificate.objects.filter(
                enrollment__social_worker=social_worker
            ).select_related('enrollment')
        except SocialWorker.DoesNotExist:
            return ANCCompletionCertificate.objects.none()
    
    @action(detail=True, methods=['post'])
    def mark_issued(self, request, pk=None):
        """Mark certificate as issued to beneficiary."""
        certificate = self.get_object()
        
        from accounts.models import SocialWorker
        social_worker = SocialWorker.objects.get(user=request.user)
        
        certificate.status = ANCCompletionCertificate.CertificateStatus.ISSUED
        certificate.issued_by = social_worker
        certificate.issued_date_actual = timezone.now().date()
        certificate.save()
        
        return Response(
            {
                'message': 'Certificate marked as issued',
                'certificate': ANCCompletionCertificateSerializer(certificate).data,
            }
        )
