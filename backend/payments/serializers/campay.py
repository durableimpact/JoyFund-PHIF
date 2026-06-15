from rest_framework import serializers


class CampayBalanceSerializer(serializers.Serializer):
    total_balance = serializers.DecimalField(max_digits=12, decimal_places=2)
    mtn_balance = serializers.DecimalField(max_digits=12, decimal_places=2)
    orange_balance = serializers.DecimalField(max_digits=12, decimal_places=2)
    currency = serializers.CharField()


class CampayDisburseSerializer(serializers.Serializer):
    amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    phone = serializers.CharField(max_length=20)
    description = serializers.CharField(max_length=255)
    hospital = serializers.UUIDField(required=False)


class CampayDisburseResponseSerializer(serializers.Serializer):
    status = serializers.CharField()
    message = serializers.CharField()
    disbursement_id = serializers.UUIDField()
    transaction_id = serializers.UUIDField()
    campay_reference = serializers.CharField()
