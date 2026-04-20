from rest_framework import serializers
from decimal import Decimal

class HospitalWithdrawalSerializer(serializers.Serializer):
    amount = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=Decimal('1.00'))
    # optional description, etc
    note = serializers.CharField(required=False, allow_blank=True)
