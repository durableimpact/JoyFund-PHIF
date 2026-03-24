from rest_framework import serializers

from ..models import Transaction, FeeSplit


class FeeSplitSerializer(serializers.ModelSerializer):
    fee_policy_name = serializers.CharField(source='fee_policy.name', read_only=True)
    escrow_percentage = serializers.DecimalField(
        source='fee_policy.escrow_fee_percentage',
        max_digits=5, decimal_places=2, read_only=True,
    )
    platform_percentage = serializers.DecimalField(
        source='fee_policy.platform_fee_percentage',
        max_digits=5, decimal_places=2, read_only=True,
    )

    class Meta:
        model = FeeSplit
        fields = [
            'id',
            'fee_policy_name',
            'gross_amount',
            'escrow_amount', 'escrow_percentage',
            'platform_amount', 'platform_percentage',
            'created_at',
        ]
        read_only_fields = fields


class TransactionSerializer(serializers.ModelSerializer):
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    direction_display = serializers.CharField(source='get_direction_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    donation = serializers.StringRelatedField()
    source = serializers.StringRelatedField()
    destination = serializers.StringRelatedField()
    fee_split = FeeSplitSerializer(read_only=True)

    class Meta:
        model = Transaction
        fields = [
            'id', 'type', 'type_display', 'direction', 'direction_display',
            'amount', 'currency', 'gateway', 'gateway_transaction_id',
            'status', 'status_display', 'donation', 'source', 'destination',
            'metadata', 'fee_split', 'created_at', 'updated_at',
        ]
        read_only_fields = fields
