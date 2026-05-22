from rest_framework import serializers

from campaigns.models import Campaign, CampaignEvent, CampaignTransaction


class CampaignEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = CampaignEvent
        exclude = ["campaign"]


class CampaignTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = CampaignTransaction
        exclude = ["campaign"]


class CampaignDetailSerializer(serializers.ModelSerializer):
    from vouchers.serializers.voucher_funding import VoucherFundingDetailSerializer

    donor_id = serializers.UUIDField(source="donor.id", read_only=True)
    total_net_raised = serializers.SerializerMethodField()
    progress_percentage = serializers.SerializerMethodField()
    events = CampaignEventSerializer(many=True, read_only=True)
    transactions = CampaignTransactionSerializer(many=True, read_only=True)
    voucher_fundings = VoucherFundingDetailSerializer(many=True, read_only=True)

    class Meta:
        model = Campaign
        fields = [
            "id",
            "donor_id",
            "title",
            "slug",
            "description",
            "cover_image",
            "event_type",
            "goal_amount",
            "available_balance",
            "total_net_raised",
            "start_date",
            "end_date",
            "is_public",
            "status",
            "is_active",
            "created_at",
            "progress_percentage",
            "events",
            "transactions",
            "voucher_fundings",
        ]

    def get_total_net_raised(self, obj):
        # Use annotated value if available for performance, else fallback to property
        return getattr(obj, "total_net_raised_calc", obj.total_net_raised)

    def get_progress_percentage(self, obj):
        return obj.progress_percentage


class CampaignBalanceSerializer(serializers.ModelSerializer):
    """
    Serializer to show campaign details along with calculated available balance.
    Used by admins for voucher fund allocation.
    """

    available_balance = serializers.DecimalField(
        max_digits=12, decimal_places=2, read_only=True
    )

    class Meta:
        model = Campaign
        fields = [
            "id",
            "title",
            "available_balance",
            "status",
            "is_active",
        ]


class CampaignCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Campaign
        fields = [
            "title",
            "description",
            "cover_image",
            "event_type",
            "goal_amount",
            "end_date",
            "is_public",
            "status",
            "is_active",
        ]

    def to_representation(self, instance):
        return CampaignDetailSerializer(instance).data
