from rest_framework import serializers

from campaigns.models import Campaign


class CampaignDetailSerializer(serializers.ModelSerializer):
    donor_id = serializers.UUIDField(source="donor.id", read_only=True)
    progress_percentage = serializers.SerializerMethodField()

    class Meta:
        model = Campaign
        fields = [
            "id",
            "donor_id",
            "title",
            "description",
            "cover_image",
            "event_type",
            "goal_amount",
            "current_amount",
            "impact_goal_count",
            "impact_service_category",
            "start_date",
            "end_date",
            "is_public",
            "status",
            "is_active",
            "created_at",
            "progress_percentage",
        ]

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
            "impact_service_category",
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
            "impact_goal_count",
            "impact_service_category",
            "end_date",
            "is_public",
            "status",
            "is_active",
        ]

    def to_representation(self, instance):
        return CampaignDetailSerializer(instance).data
