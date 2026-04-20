"""
Serializers for voucher reports and reconciliation.
"""
from rest_framework import serializers
from ..models import CareVoucher, VoucherReport, ReportDocument


class CareVoucherSerializer(serializers.ModelSerializer):
    """
    Serializer for displaying care vouchers with beneficiary and hospital info.
    Used by hospital admins to view and filter vouchers.
    """
    beneficiary_initials = serializers.SerializerMethodField()
    hospital_name = serializers.CharField(source='hospital.name', read_only=True)
    service_name = serializers.CharField(source='service.name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = CareVoucher
        fields = [
            'id',
            'voucher_code',
            'beneficiary_initials',
            'value',
            'status',
            'status_display',
            'hospital_name',
            'service_name',
            'created_at',
            'redeemed_at',
            'expiry_date',
        ]
        read_only_fields = fields

    def get_beneficiary_initials(self, obj):
        """Return beneficiary initials for privacy."""
        first_initial = obj.beneficiary.first_name[0] if obj.beneficiary.first_name else '?'
        last_initial = obj.beneficiary.last_name[0] if obj.beneficiary.last_name else '?'
        return f"{first_initial}{last_initial}"


class ReportDocumentSerializer(serializers.ModelSerializer):
    """Serializer for proof documents attached to reports."""

    class Meta:
        model = ReportDocument
        fields = [
            'id',
            'document_type',
            'file',
            'description',
            'uploaded_at',
        ]


class VoucherReportSerializer(serializers.ModelSerializer):
    """
    Serializer for monthly reconciliation reports.
    Displays aggregated statistics and status for audit trail.
    """
    documents = ReportDocumentSerializer(many=True, read_only=True)
    hospital_name = serializers.CharField(source='hospital.name', read_only=True)
    generated_by_email = serializers.CharField(
        source='generated_by.email', read_only=True
    )
    approved_by_email = serializers.CharField(
        source='approved_by.email', read_only=True, allow_null=True
    )
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    report_month_display = serializers.SerializerMethodField()

    class Meta:
        model = VoucherReport
        fields = [
            'id',
            'hospital_name',
            'report_month',
            'report_month_display',
            'total_vouchers_redeemed',
            'total_services_provided',
            'total_amount_received',
            'total_pending_vouchers',
            'total_pending_amount',
            'status',
            'status_display',
            'notes',
            'generated_by_email',
            'submitted_at',
            'approved_by_email',
            'approved_at',
            'rejection_reason',
            'documents',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'hospital_name',
            'generated_by_email',
            'approved_by_email',
            'submitted_at',
            'approved_at',
            'created_at',
            'updated_at',
            'documents',
        ]

    def get_report_month_display(self, obj):
        """Format month as 'Month Year' (e.g., 'January 2026')."""
        return obj.report_month.strftime('%B %Y')


class VoucherReportCreateSerializer(serializers.ModelSerializer):
    """
    Minimal serializer for creating/updating reports.
    Generated statistics should be auto-calculated via signals/tasks.
    """

    class Meta:
        model = VoucherReport
        fields = [
            'id',
            'report_month',
            'notes',
        ]

    def create(self, validated_data):
        """Create report for the authenticated hospital admin's hospital."""
        from accounts.models import HospitalAdmin
        
        request = self.context.get('request')
        if not request or not request.user:
            raise serializers.ValidationError("User context required")

        # Get the hospital from the HospitalAdmin profile
        try:
            hospital_admin = HospitalAdmin.objects.get(user=request.user)
            hospital = hospital_admin.hospital
            if not hospital:
                raise serializers.ValidationError(
                    "Hospital not assigned to this admin"
                )
        except HospitalAdmin.DoesNotExist:
            raise serializers.ValidationError(
                "User is not a registered hospital admin"
            )

        # Check if report already exists for this month
        existing = VoucherReport.objects.filter(
            hospital=hospital,
            report_month=validated_data['report_month']
        ).exists()
        
        if existing:
            raise serializers.ValidationError(
                "Report already exists for this month"
            )

        validated_data['hospital'] = hospital
        validated_data['generated_by'] = request.user
        
        # Calculate statistics via signal
        report = VoucherReport.objects.create(**validated_data)
        return report
