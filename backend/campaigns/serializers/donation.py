import uuid
from decimal import Decimal

from rest_framework import serializers

from campaigns.models import Donation,Payment


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = [
            'payment_id',
            'payment_method',
            'phone_number',
            'amount',
            'payment_status',
            'payment_reference',
            'created_at',
            'updated_at',
        ]


class DonationDetailSerializer(serializers.ModelSerializer):
    campaign_id = serializers.UUIDField(source='campaign.id', read_only=True)
    donor_id = serializers.UUIDField(source='donor.id', read_only=True, allow_null=True)

    payment = PaymentSerializer(read_only=True)

    class Meta:
        model = Donation
        fields = [
            'id',
            'campaign_id',
            'donor_id',
            'donor_name',
            'amount',
            'status',
            'message',
            'payment',
            'is_anonymous',
            'created_at',
            'updated_at',
        ]


class DonationCreateSerializer(serializers.ModelSerializer):

    payment_method = serializers.CharField()
    phone_number = serializers.CharField()
    
    success_url = serializers.URLField()
    failure_url = serializers.URLField()
    

    class Meta:
        model = Donation
        fields = [
            'donor_name',
            'amount',
            'message',
            'is_anonymous',
            'payment_method',
            'phone_number',
            'success_url',
            'failure_url',
        ]


# class DonationCreateSerializer(serializers.Serializer):
#     donor_name = serializers.CharField(max_length=100, required=False, allow_blank=True)
#     amount = serializers.DecimalField(max_digits=10, decimal_places=2)
#     message = serializers.CharField(required=False, allow_blank=True)
#     is_anonymous = serializers.BooleanField(default=False)
#     payment_method = serializers.CharField(max_length=10)
#     phone_number = serializers.CharField(max_length=20)
#     success_url = serializers.URLField()
#     failure_url = serializers.URLField()