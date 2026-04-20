"""
Serializers for ANC tracking system.
"""
from rest_framework import serializers
from .models import ANCEnrollment, ANCVisit, MissedAppointmentAlert, ANCCompletionCertificate
from beneficiaries.models import Beneficiary
from datetime import datetime, timedelta


class BeneficiaryANCSerializer(serializers.ModelSerializer):
    """Simplified beneficiary info for ANC context."""
    
    age = serializers.SerializerMethodField()
    
    class Meta:
        model = Beneficiary
        fields = ['id', 'full_name', 'date_of_birth', 'age', 'phone', 'email', 'digital_health_id']
    
    def get_age(self, obj):
        """Calculate age from date of birth."""
        today = datetime.today().date()
        return today.year - obj.date_of_birth.year - (
            (today.month, today.day) < (obj.date_of_birth.month, obj.date_of_birth.day)
        )


class ANCVisitSerializer(serializers.ModelSerializer):
    """Serializer for ANC visits with full details."""
    
    visit_number_display = serializers.CharField(source='get_visit_number_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    created_by_email = serializers.CharField(source='created_by.user.email', read_only=True, allow_null=True)
    is_overdue = serializers.SerializerMethodField()
    days_until_scheduled = serializers.SerializerMethodField()
    
    class Meta:
        model = ANCVisit
        fields = [
            'id',
            'visit_number',
            'visit_number_display',
            'status',
            'status_display',
            'scheduled_date',
            'actual_date',
            'is_overdue',
            'days_until_scheduled',
            'weight_kg',
            'blood_pressure',
            'hemoglobin_level',
            'clinical_notes',
            'complications_noted',
            'referred_to_hospital',
            'referral_reason',
            'created_by_email',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'created_by_email']
    
    def get_is_overdue(self, obj):
        """Check if scheduled visit is overdue and hasn't been completed."""
        if obj.status in [ANCVisit.Status.COMPLETED, ANCVisit.Status.CANCELLED]:
            return False
        today = datetime.today().date()
        return obj.scheduled_date < today
    
    def get_days_until_scheduled(self, obj):
        """Days until scheduled visit (negative if overdue)."""
        today = datetime.today().date()
        delta = obj.scheduled_date - today
        return delta.days


class MissedAppointmentAlertSerializer(serializers.ModelSerializer):
    """Serializer for missed appointment alerts."""
    
    visit_details = ANCVisitSerializer(source='visit', read_only=True)
    beneficiary_name = serializers.CharField(source='enrollment.beneficiary.full_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = MissedAppointmentAlert
        fields = [
            'id',
            'beneficiary_name',
            'visit_details',
            'status',
            'status_display',
            'missed_date',
            'alert_sent_at',
            'follow_up_date',
            'resolved_date',
            'follow_up_notes',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'missed_date',
            'alert_sent_at',
            'created_at',
            'updated_at',
        ]


class ANCCompletionCertificateSerializer(serializers.ModelSerializer):
    """Serializer for completion certificates."""
    
    beneficiary_name = serializers.CharField(source='enrollment.beneficiary.full_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    generated_by_email = serializers.CharField(source='generated_by.user.email', read_only=True, allow_null=True)
    issued_by_email = serializers.CharField(source='issued_by.user.email', read_only=True, allow_null=True)
    
    class Meta:
        model = ANCCompletionCertificate
        fields = [
            'id',
            'certificate_number',
            'beneficiary_name',
            'status',
            'status_display',
            'issued_date',
            'completion_date',
            'certificate_file',
            'generated_by_email',
            'issued_by_email',
            'issued_date_actual',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'certificate_number',
            'issued_date',
            'created_at',
            'updated_at',
        ]


class ANCEnrollmentDetailSerializer(serializers.ModelSerializer):
    """Full ANC enrollment with all related visits and alerts."""
    
    beneficiary = BeneficiaryANCSerializer(read_only=True)
    visits = ANCVisitSerializer(many=True, read_only=True)
    missed_alerts = MissedAppointmentAlertSerializer(many=True, read_only=True)
    completion_certificate = ANCCompletionCertificateSerializer(read_only=True, allow_null=True)
    
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    visits_completed = serializers.IntegerField(read_only=True)
    visits_scheduled = serializers.IntegerField(read_only=True)
    visits_missed = serializers.IntegerField(read_only=True)
    completion_percentage = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = ANCEnrollment
        fields = [
            'id',
            'beneficiary',
            'status',
            'status_display',
            'gestational_age_at_enrollment',
            'expected_delivery_date',
            'enrollment_date',
            'completion_date',
            'delivery_date',
            'high_risk',
            'notes',
            'visits_completed',
            'visits_scheduled',
            'visits_missed',
            'completion_percentage',
            'visits',
            'missed_alerts',
            'completion_certificate',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'enrollment_date',
            'created_at',
            'updated_at',
            'visits',
            'missed_alerts',
            'completion_certificate',
        ]


class ANCEnrollmentListSerializer(serializers.ModelSerializer):
    """Simplified enrollment view for dashboard lists."""
    
    beneficiary_name = serializers.CharField(source='beneficiary.full_name', read_only=True)
    beneficiary_phone = serializers.CharField(source='beneficiary.phone', read_only=True)
    beneficiary_id = serializers.CharField(source='beneficiary.digital_health_id', read_only=True)
    
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    visits_completed = serializers.IntegerField(read_only=True)
    visits_missed = serializers.IntegerField(read_only=True)
    completion_percentage = serializers.IntegerField(read_only=True)
    
    next_visit = serializers.SerializerMethodField()
    days_until_delivery = serializers.SerializerMethodField()
    
    class Meta:
        model = ANCEnrollment
        fields = [
            'id',
            'beneficiary_id',
            'beneficiary_name',
            'beneficiary_phone',
            'status',
            'status_display',
            'enrollment_date',
            'expected_delivery_date',
            'gestational_age_at_enrollment',
            'high_risk',
            'visits_completed',
            'visits_missed',
            'completion_percentage',
            'next_visit',
            'days_until_delivery',
        ]
        read_only_fields = fields
    
    def get_next_visit(self, obj):
        """Get next scheduled visit details."""
        next_visit = obj.visits.filter(
            status=ANCVisit.Status.SCHEDULED
        ).order_by('visit_number').first()
        
        if next_visit:
            return {
                'visit_number': next_visit.visit_number,
                'scheduled_date': next_visit.scheduled_date,
                'days_until': (next_visit.scheduled_date - datetime.today().date()).days,
            }
        return None
    
    def get_days_until_delivery(self, obj):
        """Days until expected delivery."""
        today = datetime.today().date()
        delta = obj.expected_delivery_date - today
        return delta.days


class ANCEnrollmentCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating new ANC enrollments."""
    
    beneficiary_id = serializers.UUIDField(write_only=True)
    
    class Meta:
        model = ANCEnrollment
        fields = [
            'beneficiary_id',
            'gestational_age_at_enrollment',
            'expected_delivery_date',
            'high_risk',
            'notes',
        ]
    
    def create(self, validated_data):
        """Create enrollment and initialize 4 recommended visits."""
        beneficiary_id = validated_data.pop('beneficiary_id')
        
        try:
            beneficiary = Beneficiary.objects.get(id=beneficiary_id)
        except Beneficiary.DoesNotExist:
            raise serializers.ValidationError("Beneficiary not found")
        
        # Get social worker from request context
        request = self.context.get('request')
        if not request or not request.user:
            raise serializers.ValidationError("User context required")
        
        try:
            from accounts.models import SocialWorker
            social_worker = SocialWorker.objects.get(user=request.user)
        except SocialWorker.DoesNotExist:
            raise serializers.ValidationError("User is not a social worker")
        
        # Create enrollment
        enrollment = ANCEnrollment.objects.create(
            beneficiary=beneficiary,
            social_worker=social_worker,
            **validated_data
        )
        
        # Initialize 4 recommended visits with scheduled dates
        from datetime import timedelta
        enrollment_date = enrollment.enrollment_date
        gestational_weeks = validated_data['gestational_age_at_enrollment']
        
        # Calculate visit dates based on standard ANC protocol
        visits_data = [
            {
                'visit_number': 1,
                'weeks': 12,
                'description': 'First visit (≤12 weeks)',
            },
            {
                'visit_number': 2,
                'weeks': 20,
                'description': 'Second visit (20 weeks)',
            },
            {
                'visit_number': 3,
                'weeks': 30,
                'description': 'Third visit (30 weeks)',
            },
            {
                'visit_number': 4,
                'weeks': 36,
                'description': 'Fourth visit (36 weeks)',
            },
        ]
        
        # Create scheduled visits
        for visit_data in visits_data:
            weeks_until = visit_data['weeks'] - gestational_weeks
            if weeks_until > 0:
                scheduled_date = enrollment_date + timedelta(weeks=weeks_until)
                ANCVisit.objects.create(
                    enrollment=enrollment,
                    visit_number=visit_data['visit_number'],
                    scheduled_date=scheduled_date,
                    status=ANCVisit.Status.SCHEDULED,
                )
        
        return enrollment
