import uuid
from decimal import Decimal

from rest_framework import serializers

from campaigns.models import Donation


class DonationDetailSerializer(serializers.ModelSerializer):
    campaign_id = serializers.UUIDField(source='campaign.id', read_only=True)
    donor_id = serializers.UUIDField(source='donor.id', read_only=True, allow_null=True)

    class Meta:
        model = Donation
        fields = [
            'id',
            'campaign_id',
            'donor_id',
            'donor_name',
            'amount',
            'transaction_reference',
            'status',
            'message',
            'payment_provider',
            'provider_transaction_id',
            'platform_fee',
            'net_amount',
            'is_anonymous',
            'confirm_at',
            'created_at',
        ]


class DonationCreateSerializer(serializers.ModelSerializer):
    transaction_reference = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = Donation
        fields = [
            'donor_name',
            'amount',
            'transaction_reference',
            'status',
            'message',
            'payment_provider',
            'provider_transaction_id',
            'platform_fee',
            'is_anonymous',
            'confirm_at',
        ]

    def create(self, validated_data):
        donor = self.context.get('donor')
        campaign = self.context['campaign']

        transaction_reference = (validated_data.get('transaction_reference') or '').strip()
        if not transaction_reference:
            transaction_reference = f"DON-{uuid.uuid4().hex[:24].upper()}"
        validated_data['transaction_reference'] = transaction_reference

        amount = validated_data.get('amount', Decimal('0'))
        platform_fee = validated_data.get('platform_fee', Decimal('0'))
        validated_data['net_amount'] = amount - platform_fee

        return Donation.objects.create(
            donor=donor,
            campaign=campaign,
            **validated_data,
        )

    def to_representation(self, instance):
        return DonationDetailSerializer(instance).data
