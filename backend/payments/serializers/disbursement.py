from rest_framework import serializers
from ..models import Disbursement, Transaction


class DisbursementStatisticsSerializer(serializers.Serializer):
    """Serializer for disbursement statistics response."""
    total_disbursed = serializers.DecimalField(
        max_digits=15, decimal_places=2,
        help_text="Total amount of completed disbursements"
    )
    total_pending = serializers.DecimalField(
        max_digits=15, decimal_places=2,
        help_text="Total amount of pending disbursements"
    )
    total_failed = serializers.DecimalField(
        max_digits=15, decimal_places=2,
        help_text="Total amount of failed disbursements"
    )
    by_status = serializers.DictField(
        child=serializers.ListField(
            child=serializers.IntegerField(),
        ),
        help_text="Disbursements grouped by status with count and total"
    )
    by_payment_method = serializers.DictField(
        child=serializers.ListField(
            child=serializers.IntegerField(),
        ),
        help_text="Disbursements grouped by payment method with count and total"
    )
    total_count = serializers.IntegerField(
        help_text="Total number of disbursement records"
    )


class DisbursementSerializer(serializers.ModelSerializer):
    """Main serializer for Disbursement model."""
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    payment_method_display = serializers.CharField(
        source='get_payment_method_display', read_only=True
    )
    hospital_name = serializers.CharField(source='hospital.name', read_only=True)
    hospital_momo = serializers.CharField(
        source='hospital.momo_number', read_only=True
    )
    created_by_name = serializers.CharField(
        source='created_by.get_full_name', read_only=True
    )
    transaction_id = serializers.UUIDField(
        source='transaction.id', read_only=True, allow_null=True
    )

    class Meta:
        model = Disbursement
        fields = [
            'id',
            'hospital',
            'hospital_name',
            'hospital_momo',
            'amount',
            'currency',
            'payment_method',
            'payment_method_display',
            'recipient_phone',
            'recipient_account',
            'status',
            'status_display',
            'external_reference',
            'gateway_transaction_id',
            'transaction_id',
            'notes',
            'error_message',
            'metadata',
            'created_at',
            'updated_at',
            'disbursed_at',
            'created_by',
            'created_by_name',
        ]
        read_only_fields = [
            'id',
            'hospital_name',
            'hospital_momo',
            'transaction_id',
            'created_by_name',
            'created_at',
            'updated_at',
        ]


class DisbursementCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating new disbursement records. The status defaults to COMPLETED and a transaction is automatically created."""
    
    class Meta:
        model = Disbursement
        fields = [
            'hospital',
            'amount',
            'payment_method',
            'recipient_phone',
            'recipient_account',
            'external_reference',
            'gateway_transaction_id',
            'notes',
            'metadata',
            'disbursed_at',
        ]


class DisbursementUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating disbursement records."""
    
    class Meta:
        model = Disbursement
        fields = [
            'status',
            'recipient_phone',
            'recipient_account',
            'external_reference',
            'gateway_transaction_id',
            'notes',
            'error_message',
            'metadata',
            'disbursed_at',
        ]


class DisbursementDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer for disbursement records."""
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    payment_method_display = serializers.CharField(
        source='get_payment_method_display', read_only=True
    )
    hospital_name = serializers.CharField(source='hospital.name', read_only=True)
    hospital_email = serializers.CharField(source='hospital.email', read_only=True)
    hospital_phone = serializers.CharField(source='hospital.phone_number', read_only=True)
    created_by_name = serializers.CharField(
        source='created_by.get_full_name', read_only=True
    )
    transaction_details = serializers.SerializerMethodField()

    class Meta:
        model = Disbursement
        fields = [
            'id',
            'hospital',
            'hospital_name',
            'hospital_email',
            'hospital_phone',
            'amount',
            'currency',
            'payment_method',
            'payment_method_display',
            'recipient_phone',
            'recipient_account',
            'status',
            'status_display',
            'external_reference',
            'gateway_transaction_id',
            'transaction_details',
            'notes',
            'error_message',
            'metadata',
            'created_at',
            'updated_at',
            'disbursed_at',
            'created_by',
            'created_by_name',
        ]
        read_only_fields = fields

    def get_transaction_details(self, obj):
        """Return basic transaction details if available."""
        if obj.transaction:
            from .transaction import TransactionSerializer
            return TransactionSerializer(obj.transaction).data
        return None

