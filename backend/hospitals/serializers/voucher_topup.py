from rest_framework import serializers
from decimal import Decimal
from hospitals.models import (
    VoucherTopUpRequest,
    VoucherTopUpRequestStatus,
    MedicalClaim,
)
from campaigns.models import Campaign


class VoucherTopUpRequestSerializer(serializers.ModelSerializer):
    """View existing top-up requests."""

    class Meta:
        model = VoucherTopUpRequest
        fields = [
            "id",
            "medical_claim",
            "requested_amount",
            "reason",
            "status",
            "created_by",
            "reviewed_by",
            "review_notes",
            "created_at",
            "reviewed_at",
        ]
        read_only_fields = ["id", "created_at", "reviewed_at", "reviewed_by"]


class VoucherTopUpRequestCreateSerializer(serializers.ModelSerializer):
    """Receptionist submits a top-up request."""

    class Meta:
        model = VoucherTopUpRequest
        fields = ["medical_claim", "requested_amount", "reason"]

    def validate_medical_claim(self, value):
        # Verify claim exists and hasn't already been settled
        if value.claim_status != "PENDING":
            raise serializers.ValidationError(
                f"Claim status is {value.claim_status}. Only PENDING claims can request top-ups."
            )
        return value

    def validate_requested_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Requested amount must be > 0.")
        return value

    def create(self, validated_data):
        receptionist = self.context["request"].user.receptionist
        return VoucherTopUpRequest.objects.create(
            created_by=receptionist, **validated_data
        )


class CampaignAllocationNestedSerializer(serializers.Serializer):
    """Nested serializer for campaign allocation in top-up approval."""

    campaign_id = serializers.IntegerField()
    amount = serializers.DecimalField(max_digits=12, decimal_places=2)

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Amount must be > 0.")
        return value


class VoucherTopUpRequestApproveSerializer(serializers.Serializer):
    """Admin approves top-up with campaign allocations."""

    campaign_allocations = CampaignAllocationNestedSerializer(many=True)
    review_notes = serializers.CharField(
        max_length=1000, required=False, allow_blank=True
    )

    def validate_campaign_allocations(self, value):
        if not value:
            raise serializers.ValidationError(
                "At least one campaign allocation required."
            )
        return value


class MedicalClaimMarkCompleteSerializer(serializers.Serializer):
    """Receptionist marks service as complete."""

    pass  # No additional fields needed


class MedicalClaimFinalVerifySerializer(serializers.Serializer):
    """Admin verifies claim and triggers fund disbursement."""

    approval_notes = serializers.CharField(
        max_length=1000, required=False, allow_blank=True
    )
