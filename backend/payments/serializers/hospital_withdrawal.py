from rest_framework import serializers

class HospitalWithdrawalSerializer(serializers.Serializer):
    amount = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=1.0)
    # optional description, etc
    note = serializers.CharField(required=False, allow_blank=True)
