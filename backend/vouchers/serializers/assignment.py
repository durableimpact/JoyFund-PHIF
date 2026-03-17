from rest_framework import serializers
from ..models import VoucherAssignment

class VoucherAssignmentSerializer(serializers.ModelSerializer):
    beneficiary = serializers.StringRelatedField()
    campaign = serializers.StringRelatedField()
    hospital = serializers.StringRelatedField()
    service = serializers.StringRelatedField()
    assigned_to = serializers.StringRelatedField()
    approved_by = serializers.StringRelatedField()
    status = serializers.CharField(source='get_status_display')

    class Meta:
        model = VoucherAssignment
        fields = '__all__'
