from rest_framework import serializers

from campaigns.models import Campaign


class CampaignDetailSerializer(serializers.ModelSerializer):
    donor_id = serializers.UUIDField(source='donor.id', read_only=True)
    account_id = serializers.UUIDField(source='account.id', read_only=True, allow_null=True)
    progress_percentage = serializers.SerializerMethodField()

    class Meta:
        model = Campaign
        fields = [
            'id',
            'donor_id',
            'title',
            'description',
            'cover_image',
            'event_type',
            'goal_amount',
            'current_amount',
            'impact_goal_count',
            'impact_service_category',
            'account_id',
            'start_date',
            'end_date',
            'is_public',
            'status',
            'is_active',
            'created_at',
            'progress_percentage',
        ]

    def get_progress_percentage(self, obj):
        return obj.progress_percentage


class CampaignCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Campaign
        fields = [
            'title',
            'description',
            'cover_image',
            'event_type',
            'goal_amount',
            'impact_goal_count',
            'impact_service_category',
            'end_date',
            'is_public',
            'status',
            'is_active',
        ]

    def to_representation(self, instance):
        return CampaignDetailSerializer(instance).data
