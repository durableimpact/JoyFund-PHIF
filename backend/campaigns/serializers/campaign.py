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


class CampaignListSerializer(serializers.ModelSerializer):
    total_net_raised = serializers.SerializerMethodField()
    progress_percentage = serializers.SerializerMethodField()
    total_number_of_successfull_donations = serializers.SerializerMethodField()
    goal = serializers.DecimalField(
        source="goal_amount", max_digits=12, decimal_places=2, read_only=True
    )
    certificate_generated = serializers.BooleanField(read_only=True)
    certificate_url = serializers.SerializerMethodField()

    class Meta:
        model = Campaign
        fields = [
            "id",
            "title",
            "description",
            "cover_image",
            "goal",
            "slug",
            "total_net_raised",
            "progress_percentage",
            "total_number_of_successfull_donations",
            "certificate_generated",
            "certificate_url",
        ]

    def get_certificate_url(self, obj):
        if obj.certificate_file:
            return obj.certificate_file.url
        return None

    def get_total_net_raised(self, obj):
        return getattr(obj, "total_net_raised_calc", obj.total_net_raised)

    def get_progress_percentage(self, obj):
        return obj.progress_percentage

    def get_total_number_of_successfull_donations(self, obj):
        return getattr(
            obj, "total_number_of_successfull_donations_calc",
            obj.donations.filter(status="SUCCESS").count(),
        )


class CampaignDetailSerializer(serializers.ModelSerializer):
    from vouchers.serializers.voucher_funding import VoucherFundingDetailSerializer
    from accounts.serializers.donor import DonorMinimalSerializer

    donor = DonorMinimalSerializer(read_only=True)
    total_net_raised = serializers.SerializerMethodField()
    progress_percentage = serializers.SerializerMethodField()
    events = CampaignEventSerializer(many=True, read_only=True)
    transactions = CampaignTransactionSerializer(many=True, read_only=True)
    voucher_fundings = VoucherFundingDetailSerializer(many=True, read_only=True)
    certificate_generated = serializers.BooleanField(read_only=True)
    certificate_url = serializers.SerializerMethodField()

    class Meta:
        model = Campaign
        fields = [
            "id",
            "donor",
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
            "certificate_generated",
            "certificate_url",
            "events",
            "transactions",
            "voucher_fundings",
        ]

    def get_certificate_url(self, obj):
        if obj.certificate_file:
            return obj.certificate_file.url
        return None

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
