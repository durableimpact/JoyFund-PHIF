"""
Views for ANC tracking system endpoints.
"""
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db.models import Q, Count
from django_filters.rest_framework import DjangoFilterBackend
from datetime import datetime, timedelta

from ..models import ANCEnrollment, ANCVisit, MissedAppointmentAlert, ANCCompletionCertificate
from ..serializers import (
    ANCEnrollmentListSerializer,
    ANCEnrollmentDetailSerializer,
    ANCEnrollmentCreateUpdateSerializer,
    ANCVisitSerializer,
    MissedAppointmentAlertSerializer,
    ANCCompletionCertificateSerializer,
)
from ..tasks import (
    send_missed_appointment_notification,
    generate_completion_certificate,
)


class ANCEnrollmentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing ANC enrollments.
    
    Actions:
    - list: Get all enrollments (with filtering and search)
    - retrieve: Get single enrollment details
    - create: Create new enrollment
    - update: Update existing enrollment
    - partial_update: Partial update
    - mark_complete: Mark enrollment as completed
    - get_progress: Get enrollment progress details
    """
    
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'high_risk']
    search_fields = ['beneficiary__full_name', 'beneficiary__digital_health_id']
    ordering_fields = ['enrollment_date', 'expected_delivery_date']
    ordering = ['-enrollment_date']
    
    queryset = ANCEnrollment.objects.select_related(
        'beneficiary',
        'social_worker',
        'campaign'
    ).prefetch_related('visits')
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action == 'list':
            return ANCEnrollmentListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return ANCEnrollmentCreateUpdateSerializer
        else:
            return ANCEnrollmentDetailSerializer
    
    def get_queryset(self):
        """Filter enrollments based on user role."""
        # Short-circuit during Swagger schema generation
        if getattr(self, 'swagger_fake_view', False):
            return ANCEnrollment.objects.none()
        
        queryset = super().get_queryset()
        user = self.request.user
        
        # Social workers can only see their own enrollments
        if hasattr(user, 'user_type') and user.user_type == 'social_worker':
            queryset = queryset.filter(social_worker=user)
        
        # Apply status filter from query params
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        return queryset
    
    @action(detail=True, methods=['post'])
    def mark_complete(self, request, pk=None):
        """Mark enrollment as completed."""
        enrollment = self.get_object()
        
        if enrollment.status == ANCEnrollment.Status.COMPLETED:
            return Response(
                {'detail': 'Enrollment is already completed.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if all visits are marked
        incomplete_visits = enrollment.visits.exclude(
            status=ANCVisit.Status.COMPLETED
        ).count()
        
        if incomplete_visits > 0:
            return Response(
                {
                    'detail': f'{incomplete_visits} visits are not marked as completed.',
                    'incomplete_visits': incomplete_visits
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        enrollment.status = ANCEnrollment.Status.COMPLETED
        enrollment.completion_date = timezone.now()
        enrollment.save()
        
        serializer = self.get_serializer(enrollment)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def get_progress(self, request, pk=None):
        """Get enrollment progress details."""
        enrollment = self.get_object()
        
        visits = enrollment.visits.all()
        completed = visits.filter(status=ANCVisit.Status.COMPLETED).count()
        missed = visits.filter(status=ANCVisit.Status.MISSED).count()
        scheduled = visits.filter(status=ANCVisit.Status.SCHEDULED).count()
        
        active_alerts = MissedAppointmentAlert.objects.filter(
            enrollment=enrollment,
            status=MissedAppointmentAlert.AlertStatus.ACTIVE
        ).count()
        
        return Response({
            'enrollment_id': enrollment.id,
            'status': enrollment.get_status_display(),
            'completion_percentage': enrollment.completion_percentage,
            'visits': {
                'total': 4,
                'completed': completed,
                'missed': missed,
                'scheduled': scheduled,
            },
            'alerts': {
                'active_missed_appointments': active_alerts,
            },
            'high_risk': enrollment.high_risk,
            'days_since_enrollment': (
                timezone.now().date() - enrollment.enrollment_date
            ).days,
        })
    
    @action(detail=False, methods=['get'])
    def high_risk_summary(self, request):
        """Get summary of high-risk enrollments."""
        high_risk = ANCEnrollment.objects.filter(
            high_risk=True,
            status=ANCEnrollment.Status.ACTIVE
        ).aggregate(
            total=Count('id'),
            completed_visits=Count('visits', filter=Q(visits__status=ANCVisit.Status.COMPLETED))
        )
        
        return Response({
            'high_risk_active': high_risk['total'],
            'average_visits_completed': (
                high_risk['completed_visits'] / max(high_risk['total'], 1)
            ),
        })


class ANCVisitViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing ANC visits.
    
    Actions:
    - list: Get all visits (filterable)
    - retrieve: Get single visit
    - create: Create new visit
    - update: Update visit
    - mark_completed: Mark visit as completed
    - send_reminder: Send reminder for upcoming visit
    """
    
    permission_classes = [IsAuthenticated]
    serializer_class = ANCVisitSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status', 'enrollment', 'visit_number']
    ordering_fields = ['scheduled_date']
    ordering = ['scheduled_date']
    
    queryset = ANCVisit.objects.select_related('enrollment__beneficiary', 'created_by')
    
    def perform_create(self, serializer):
        """Set created_by to current user."""
        serializer.save(created_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def mark_completed(self, request, pk=None):
        """Mark visit as completed with clinical data."""
        visit = self.get_object()
        
        data = request.data
        
        visit.status = ANCVisit.Status.COMPLETED
        visit.actual_date = data.get('actual_date', timezone.now().date())
        visit.weight_kg = data.get('weight_kg')
        visit.blood_pressure = data.get('blood_pressure')
        visit.hemoglobin_level = data.get('hemoglobin_level')
        visit.clinical_notes = data.get('clinical_notes')
        visit.complications_noted = data.get('complications_noted', False)
        visit.referred_to_hospital = data.get('referred_to_hospital', False)
        visit.referral_reason = data.get('referral_reason')
        
        visit.save()
        
        serializer = self.get_serializer(visit)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def send_reminder(self, request, pk=None):
        """Send reminder for upcoming visit."""
        visit = self.get_object()
        
        if visit.status != ANCVisit.Status.SCHEDULED:
            return Response(
                {'detail': 'Can only send reminders for scheduled visits.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Trigger reminder task
        send_visit_reminder.delay(visit.id)
        
        return Response({'detail': 'Reminder sent successfully.'})
    
    @action(detail=False, methods=['get'])
    def overdue(self, request):
        """Get all overdue visits."""
        today = timezone.now().date()
        overdue_visits = self.queryset.filter(
            scheduled_date__lt=today,
            status__in=[
                ANCVisit.Status.SCHEDULED,
                ANCVisit.Status.RESCHEDULED,
            ]
        )
        
        serializer = self.get_serializer(overdue_visits, many=True)
        return Response({
            'count': overdue_visits.count(),
            'visits': serializer.data
        })


class MissedAppointmentAlertViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for viewing missed appointment alerts.
    
    Actions:
    - list: Get all alerts (filterable)
    - retrieve: Get single alert
    - resolve: Mark alert as resolved
    """
    
    permission_classes = [IsAuthenticated]
    serializer_class = MissedAppointmentAlertSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status', 'enrollment']
    ordering_fields = ['missed_date']
    ordering = ['-missed_date']
    
    queryset = MissedAppointmentAlert.objects.select_related(
        'enrollment__beneficiary',
        'visit'
    )
    
    @action(detail=True, methods=['post'])
    def resolve(self, request, pk=None):
        """Resolve a missed appointment alert."""
        alert = self.get_object()
        
        if alert.status == MissedAppointmentAlert.AlertStatus.RESOLVED:
            return Response(
                {'detail': 'Alert is already resolved.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        follow_up_notes = request.data.get('follow_up_notes', '')
        
        alert.status = MissedAppointmentAlert.AlertStatus.RESOLVED
        alert.follow_up_notes = follow_up_notes
        alert.resolved_date = timezone.now()
        alert.save()
        
        serializer = self.get_serializer(alert)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def active_alerts(self, request):
        """Get all active missed appointment alerts."""
        alerts = self.queryset.filter(
            status=MissedAppointmentAlert.AlertStatus.ACTIVE
        )
        
        serializer = self.get_serializer(alerts, many=True)
        return Response({
            'count': alerts.count(),
            'alerts': serializer.data
        })


class ANCCompletionCertificateViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for viewing ANC completion certificates.
    
    Actions:
    - list: Get all certificates (filterable)
    - retrieve: Get single certificate
    - generate: Generate certificate for completed enrollment
    """
    
    permission_classes = [IsAuthenticated]
    serializer_class = ANCCompletionCertificateSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'enrollment']
    search_fields = ['certificate_number', 'enrollment__beneficiary__full_name']
    ordering_fields = ['issued_date']
    ordering = ['-issued_date']
    
    queryset = ANCCompletionCertificate.objects.select_related(
        'enrollment__beneficiary',
        'generated_by',
        'issued_by'
    )
    
    @action(detail=False, methods=['post'])
    def generate_for_enrollment(self, request):
        """Generate certificate for a completed enrollment."""
        enrollment_id = request.data.get('enrollment_id')
        
        if not enrollment_id:
            return Response(
                {'detail': 'enrollment_id is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            enrollment = ANCEnrollment.objects.get(id=enrollment_id)
        except ANCEnrollment.DoesNotExist:
            return Response(
                {'detail': 'Enrollment not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        if enrollment.status != ANCEnrollment.Status.COMPLETED:
            return Response(
                {'detail': 'Enrollment must be marked as completed first.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if certificate already exists
        existing = ANCCompletionCertificate.objects.filter(
            enrollment=enrollment
        ).exists()
        
        if existing:
            return Response(
                {'detail': 'Certificate already exists for this enrollment.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Generate new certificate
        certificate = ANCCompletionCertificate.objects.create(
            enrollment=enrollment,
            generated_by=request.user,
            status=ANCCompletionCertificate.CertificateStatus.GENERATED,
        )
        
        # Trigger async certificate generation
        generate_completion_certificate.delay(certificate.id)
        
        serializer = self.get_serializer(certificate)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
