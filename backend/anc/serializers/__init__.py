"""
Serializers for ANC tracking models.
"""
from rest_framework import serializers
from django.utils import timezone
from datetime import datetime, timedelta

from beneficiaries.models import Beneficiary
from accounts.models import User, SocialWorker, Role
from ..models import ANCEnrollment, ANCVisit, MissedAppointmentAlert, ANCCompletionCertificate


class ANCVisitSerializer(serializers.ModelSerializer):
    """Serializer for ANC visit records."""
    
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    visit_number_display = serializers.CharField(source='get_visit_number_display', read_only=True)
    is_overdue = serializers.SerializerMethodField()
    created_by_name = serializers.SerializerMethodField()
    
    class Meta:
        model = ANCVisit
        fields = [
            'id',
            'enrollment',
            'visit_number',
            'visit_number_display',
            'status',
            'status_display',
            'scheduled_date',
            'actual_date',
            'weight_kg',
            'blood_pressure',
            'hemoglobin_level',
            'clinical_notes',
            'complications_noted',
            'referred_to_hospital',
            'referral_reason',
            'is_overdue',
            'created_by',
            'created_by_name',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at', 'created_by']
    
    def get_is_overdue(self, obj):
        """Check if visit is overdue."""
        if obj.status in [ANCVisit.Status.COMPLETED, ANCVisit.Status.CANCELLED]:
            return False
        
        today = datetime.today().date()
        return obj.scheduled_date < today
    
    def get_created_by_name(self, obj):
        """Get name of user who created the visit record."""
        if obj.created_by:
            return f"{obj.created_by.first_name} {obj.created_by.last_name}".strip()
        return None


class ANCEnrollmentListSerializer(serializers.ModelSerializer):
    """Serializer for listing ANC enrollments."""
    
    beneficiary_name = serializers.CharField(source='beneficiary.full_name', read_only=True)
    beneficiary_id = serializers.CharField(source='beneficiary.digital_health_id', read_only=True)
    social_worker_name = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    visits_completed = serializers.IntegerField(read_only=True)
    completion_percentage = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = ANCEnrollment
        fields = [
            'id',
            'beneficiary',
            'beneficiary_name',
            'beneficiary_id',
            'status',
            'status_display',
            'enrollment_date',
            'expected_delivery_date',
            'delivery_date',
            'high_risk',
            'visits_completed',
            'completion_percentage',
            'social_worker',
            'social_worker_name',
        ]
    
    def get_social_worker_name(self, obj):
        """Get social worker's name."""
        if obj.social_worker:
            return f"{obj.social_worker.first_name} {obj.social_worker.last_name}".strip()
        return None


class ANCEnrollmentDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer for ANC enrollments with nested visits."""
    
    beneficiary = serializers.SerializerMethodField()
    social_worker = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    visits = ANCVisitSerializer(many=True, read_only=True)
    visits_summary = serializers.SerializerMethodField()
    progress_percentage = serializers.IntegerField(source='completion_percentage', read_only=True)
    
    class Meta:
        model = ANCEnrollment
        fields = [
            'id',
            'beneficiary',
            'status',
            'status_display',
            'enrollment_date',
            'gestational_age_at_enrollment',
            'expected_delivery_date',
            'delivery_date',
            'high_risk',
            'notes',
            'completion_date',
            'visits',
            'visits_summary',
            'progress_percentage',
            'social_worker',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at', 'completion_date']
    
    def get_beneficiary(self, obj):
        """Serialize beneficiary details."""
        return {
            'id': obj.beneficiary.id,
            'name': obj.beneficiary.full_name,
            'phone': obj.beneficiary.phone,
            'digital_health_id': obj.beneficiary.digital_health_id,
            'location': str(obj.beneficiary.location),
        }
    
    def get_social_worker(self, obj):
        """Serialize social worker details."""
        if obj.social_worker:
            return {
                'id': obj.social_worker.id,
                'name': f"{obj.social_worker.first_name} {obj.social_worker.last_name}".strip(),
                'phone': obj.social_worker.phone,
            }
        return None
    
    def get_visits_summary(self, obj):
        """Get summary of visit completion."""
        total = 4
        completed = obj.visits_completed
        scheduled = obj.visits.filter(status=ANCVisit.Status.SCHEDULED).count()
        missed = obj.visits.filter(status=ANCVisit.Status.MISSED).count()
        
        return {
            'total': total,
            'completed': completed,
            'scheduled': scheduled,
            'missed': missed,
            'percentage': obj.completion_percentage,
        }


class MissedAppointmentAlertSerializer(serializers.ModelSerializer):
    """Serializer for missed appointment alerts."""
    
    beneficiary_name = serializers.CharField(
        source='enrollment.beneficiary.full_name',
        read_only=True
    )
    enrollment_id = serializers.IntegerField(source='enrollment.id', read_only=True)
    visit_number = serializers.IntegerField(source='visit.visit_number', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    days_overdue = serializers.SerializerMethodField()
    
    class Meta:
        model = MissedAppointmentAlert
        fields = [
            'id',
            'enrollment',
            'enrollment_id',
            'beneficiary_name',
            'visit',
            'visit_number',
            'missed_date',
            'alert_sent_at',
            'follow_up_date',
            'status',
            'status_display',
            'follow_up_notes',
            'rescheduled_visit',
            'resolved_date',
            'days_overdue',
            'created_at',
        ]
        read_only_fields = ['created_at', 'missed_date', 'alert_sent_at']
    
    def get_days_overdue(self, obj):
        """Calculate number of days overdue."""
        today = datetime.today().date()
        days = (today - obj.missed_date).days
        return max(0, days)


class ANCCompletionCertificateSerializer(serializers.ModelSerializer):
    """Serializer for ANC completion certificates."""
    
    beneficiary_name = serializers.CharField(
        source='enrollment.beneficiary.full_name',
        read_only=True
    )
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    generated_by_name = serializers.SerializerMethodField()
    issued_by_name = serializers.SerializerMethodField()
    
    class Meta:
        model = ANCCompletionCertificate
        fields = [
            'id',
            'certificate_number',
            'enrollment',
            'beneficiary_name',
            'status',
            'status_display',
            'completion_date',
            'issued_date',
            'issued_date_actual',
            'generated_by',
            'generated_by_name',
            'issued_by',
            'issued_by_name',
            'certificate_file',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'certificate_number',
            'created_at',
            'updated_at',
            'generated_by',
            'issued_date'
        ]
    
    def get_generated_by_name(self, obj):
        """Get generator's name."""
        if obj.generated_by:
            return f"{obj.generated_by.first_name} {obj.generated_by.last_name}".strip()
        return None
    
    def get_issued_by_name(self, obj):
        """Get issuer's name."""
        if obj.issued_by:
            return f"{obj.issued_by.first_name} {obj.issued_by.last_name}".strip()
        return None


class ANCEnrollmentCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating and updating ANC enrollments."""
    
    beneficiary_id = serializers.PrimaryKeyRelatedField(
        queryset=Beneficiary.objects.all(),
        source='beneficiary',
        write_only=True
    )
    social_worker_id = serializers.PrimaryKeyRelatedField(
        queryset=SocialWorker.objects.all(),
        source='social_worker',
        write_only=True,
        required=False,
        allow_null=True
    )
    
    class Meta:
        model = ANCEnrollment
        fields = [
            'beneficiary_id',
            'gestational_age_at_enrollment',
            'expected_delivery_date',
            'high_risk',
            'notes',
            'social_worker_id',
        ]
    
    def validate_expected_delivery_date(self, value):
        """Validate delivery date is in future."""
        if value and value <= timezone.now().date():
            raise serializers.ValidationError(
                "Expected delivery date must be in the future."
            )
        return value
    
    def validate_gestational_age_at_enrollment(self, value):
        """Validate gestational age is reasonable."""
        if value is not None and (value < 4 or value > 42):
            raise serializers.ValidationError(
                "Gestational age must be between 4 and 42 weeks."
            )
        return value
    
    def validate(self, data):
        """Validate enrollment data."""
        beneficiary = data.get('beneficiary')
        
        # Check if beneficiary already has active enrollment
        if beneficiary:
            existing = ANCEnrollment.objects.filter(
                beneficiary=beneficiary,
                status=ANCEnrollment.Status.ACTIVE
            ).exists()
            
            if existing and not self.instance:  # Don't check on updates
                raise serializers.ValidationError(
                    "Beneficiary already has an active ANC enrollment."
                )
        
        return data
    
    def create(self, validated_data):
        """Create new enrollment with scheduled visits."""
        enrollment = ANCEnrollment.objects.create(
            status=ANCEnrollment.Status.ACTIVE,
            **validated_data
        )
        
        # Create 4 scheduled visits
        base_date = enrollment.enrollment_date
        visits_timing = [
            (2, 1),
            (6, 2),
            (10, 3),
            (14, 4),
        ]
        
        for weeks_offset, visit_num in visits_timing:
            scheduled_date = base_date + timedelta(weeks=weeks_offset)
            ANCVisit.objects.create(
                enrollment=enrollment,
                visit_number=visit_num,
                scheduled_date=scheduled_date,
                status=ANCVisit.Status.SCHEDULED,
            )
        
        return enrollment
