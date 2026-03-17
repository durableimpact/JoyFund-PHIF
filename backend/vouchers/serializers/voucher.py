from rest_framework import serializers

from ..models import VoucherAssignment, CareVoucher, VoucherAuditLog


class VoucherAuditLogSerializer(serializers.ModelSerializer):
    performed_by = serializers.StringRelatedField()
    action = serializers.CharField(source='get_action_display')

    class Meta:
        model = VoucherAuditLog
        fields = ['timestamp', 'action', 'performed_by', 'notes']


class CareVoucherDetailSerializer(serializers.ModelSerializer):
    beneficiary = serializers.StringRelatedField()
    campaign = serializers.StringRelatedField()
    hospital = serializers.StringRelatedField()
    service = serializers.StringRelatedField()
    status = serializers.CharField(source='get_status_display')
    audit_logs = VoucherAuditLogSerializer(many=True, read_only=True)

    class Meta:
        model = CareVoucher
        fields = [
            'id', 'voucher_code', 'beneficiary', 'campaign', 'hospital', 'service', 'value',
            'status', 'created_at', 'expiry_date', 'locked_at', 'redeemed_at',
            'audit_logs'
        ]


class CareVoucherListSerializer(serializers.ModelSerializer):
    beneficiary = serializers.StringRelatedField()
    hospital = serializers.StringRelatedField()
    status = serializers.CharField(source='get_status_display')

    class Meta:
        model = CareVoucher
        fields = [
            'id', 'voucher_code', 'beneficiary', 'hospital', 'value',
            'status', 'expiry_date'
        ]
