from rest_framework import serializers

from campaigns.models import Campaign, CampaignEvent, CampaignTransaction
from accounts.serializers.donor import DonorMinimalSerializer


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
    certificate_generated = serializers.SerializerMethodField()
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
            "supports_specific_person",
        ]

    def _is_owner(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return False
        try:
            return request.user.donor.id == obj.donor_id
        except Exception:
            return False

    def get_certificate_generated(self, obj):
        return self._is_owner(obj) and obj.certificate_generated

    def get_certificate_url(self, obj):
        if self._is_owner(obj) and obj.certificate_file:
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
    certificate_generated = serializers.SerializerMethodField()
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
            "supports_specific_person",
        ]

    def _is_owner(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return False
        try:
            return request.user.donor.id == obj.donor_id
        except Exception:
            return False

    def get_certificate_generated(self, obj):
        return self._is_owner(obj) and obj.certificate_generated

    def get_certificate_url(self, obj):
        if self._is_owner(obj) and obj.certificate_file:
            return obj.certificate_file.url
        return None

    def get_total_net_raised(self, obj):
        # Use annotated value if available for performance, else fallback to property
        return getattr(obj, "total_net_raised_calc", obj.total_net_raised)

    def get_progress_percentage(self, obj):
        return obj.progress_percentage


class CampaignStaffSerializer(serializers.ModelSerializer):
    """Staff-only serializer exposing beneficiary intake fields for review."""
    donor = DonorMinimalSerializer(read_only=True)
    linked_beneficiary_id = serializers.UUIDField(
        source="linked_beneficiary.id", read_only=True
    )
    assigned_social_worker_name = serializers.SerializerMethodField()

    class Meta:
        model = Campaign
        fields = [
            "id",
            "donor",
            "title",
            "slug",
            "created_at",
            "supports_specific_person",
            "beneficiary_name",
            "beneficiary_contact",
            "beneficiary_situation",
            "verification_status",
            "linked_beneficiary_id",
            "assigned_social_worker_name",
            "assigned_social_worker",
            "status",
            "is_public",
        ]

    def get_assigned_social_worker_name(self, obj):
        if obj.assigned_social_worker:
            try:
                return obj.assigned_social_worker.user.get_full_name() or obj.assigned_social_worker.user.email
            except Exception:
                return None
        return None


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
            "supports_specific_person",
            "beneficiary_name",
            "beneficiary_contact",
            "beneficiary_situation",
        ]

    def validate(self, attrs):
        if attrs.get("supports_specific_person"):
            beneficiary_name = attrs.get("beneficiary_name", "")
            beneficiary_contact = attrs.get("beneficiary_contact", "")
            if not beneficiary_name or not beneficiary_name.strip():
                raise serializers.ValidationError(
                    {"beneficiary_name": "This field is required when supporting a specific person."}
                )
            if not beneficiary_contact or not beneficiary_contact.strip():
                raise serializers.ValidationError(
                    {"beneficiary_contact": "This field is required when supporting a specific person."}
                )
        return attrs

    def to_representation(self, instance):
        return CampaignDetailSerializer(instance, context=self.context).data
