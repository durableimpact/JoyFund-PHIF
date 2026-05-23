from rest_framework import serializers
from django.db import transaction
from decimal import Decimal
from vouchers.models.Voucher import Voucher
from vouchers.models.VoucherFunding import VoucherFunding
from beneficiaries.models.health_issue import HealthIssue
from hospitals.models import Hospital
from campaigns.models import Campaign
from vouchers.services import create_voucher_from_approved_health_issue


class VoucherCreateSerializer(serializers.ModelSerializer):
    health_issue_id = serializers.PrimaryKeyRelatedField(
        queryset=HealthIssue.objects.filter(status="VALIDATED"),
        source="health_issue",
        write_only=True,
    )
    hospital_id = serializers.PrimaryKeyRelatedField(
        queryset=Hospital.objects.filter(is_active=True),
        source="hospital",
        write_only=True,
    )
    campaign_id = serializers.PrimaryKeyRelatedField(
        queryset=Campaign.objects.all(),  # Filters can be applied in __init__ or view if needed
        source="campaign",
        write_only=True,
    )
    amount = serializers.DecimalField(
        max_digits=12, decimal_places=2, write_only=True, min_value=Decimal("1.00")
    )

    class Meta:
        model = Voucher
        fields = [
            "id",
            "voucher_code",
            "status",
            "health_issue_id",
            "hospital_id",
            "campaign_id",
            "amount",
        ]
        read_only_fields = ["id", "voucher_code", "status"]

    def validate_health_issue_id(self, value):
        if Voucher.objects.filter(health_issue=value).exists():
            raise serializers.ValidationError(
                "A voucher already exists for this health issue."
            )
        return value

    def create(self, validated_data):
        health_issue = validated_data.pop("health_issue")
        hospital = validated_data.pop("hospital")
        campaign = validated_data.pop("campaign")
        amount = validated_data.pop("amount")

        voucher, message = create_voucher_from_approved_health_issue(
            health_issue=health_issue,
            hospital=hospital,
            amount=amount,
            campaign=campaign,
        )

        if not voucher:
            raise serializers.ValidationError(message)

        return voucher


class CampaignAllocationSerializer(serializers.Serializer):
    """
    Nested serializer for campaign allocation in multi-campaign voucher creation.
    Admin can specify either amount OR percentage for each campaign.
    """

    campaign_id = serializers.PrimaryKeyRelatedField(
        queryset=Campaign.objects.all(), write_only=True
    )
    amount = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        required=False,
        allow_null=True,
        min_value=Decimal("1.00"),
    )
    percentage = serializers.DecimalField(
        max_digits=5,
        decimal_places=2,
        required=False,
        allow_null=True,
        min_value=Decimal("0.01"),
        max_value=Decimal("100.00"),
    )

    def validate(self, data):
        amount = data.get("amount")
        percentage = data.get("percentage")

        if not amount and not percentage:
            raise serializers.ValidationError(
                "Either 'amount' or 'percentage' must be provided."
            )

        if amount and percentage:
            raise serializers.ValidationError(
                "Provide either 'amount' or 'percentage', not both."
            )

        return data


class VoucherCreateMultipleCampaignsSerializer(serializers.ModelSerializer):
    """
    Create a voucher funded by multiple campaigns.
    Admin specifies which campaigns contribute and how much (amount or percentage).
    """

    health_issue_id = serializers.PrimaryKeyRelatedField(
        queryset=HealthIssue.objects.filter(status="VALIDATED"),
        source="health_issue",
        write_only=True,
    )
    hospital_id = serializers.PrimaryKeyRelatedField(
        queryset=Hospital.objects.filter(is_active=True),
        source="hospital",
        write_only=True,
    )
    total_amount = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        write_only=True,
        min_value=Decimal("1.00"),
        required=False,
        allow_null=True,
        help_text="Total amount to allocate to the voucher. If not provided, will be calculated from campaign allocations.",
    )
    campaign_allocations = CampaignAllocationSerializer(
        many=True,
        write_only=True,
        help_text="List of campaigns and their contributions",
    )

    class Meta:
        model = Voucher
        fields = [
            "id",
            "voucher_code",
            "status",
            "health_issue_id",
            "hospital_id",
            "total_amount",
            "campaign_allocations",
        ]
        read_only_fields = ["id", "voucher_code", "status"]

    def validate_health_issue_id(self, value):
        if Voucher.objects.filter(health_issue=value).exists():
            raise serializers.ValidationError(
                "A voucher already exists for this health issue."
            )
        return value

    def validate_campaign_allocations(self, allocations):
        if not allocations:
            raise serializers.ValidationError(
                "At least one campaign allocation must be provided."
            )
        return allocations

    def validate(self, data):
        allocations = data.get("campaign_allocations", [])
        total_amount = data.get("total_amount")

        # Check for duplicate campaigns
        campaign_ids = [a.get("campaign_id").id for a in allocations]
        if len(campaign_ids) != len(set(campaign_ids)):
            raise serializers.ValidationError(
                "Duplicate campaigns in allocations. Each campaign can appear only once."
            )

        # Calculate total from fixed amounts if not provided
        fixed_amounts = [
            a.get("amount") for a in allocations if a.get("amount") is not None
        ]
        percentages = [
            a.get("percentage") for a in allocations if a.get("percentage") is not None
        ]

        # If percentages are used, verify they sum to <= 100
        if percentages:
            total_percentage = sum(percentages)
            if total_percentage > Decimal("100.00"):
                raise serializers.ValidationError(
                    f"Total percentage {total_percentage}% exceeds 100%."
                )

        # Calculate total_amount if not provided
        if not total_amount:
            if fixed_amounts:
                # Use sum of fixed amounts as total
                calculated_total = sum(fixed_amounts)
                data["total_amount"] = calculated_total
            else:
                # All percentages but no total_amount provided
                raise serializers.ValidationError(
                    "total_amount is required when using percentage-based allocations."
                )
        else:
            # Verify fixed amounts don't exceed provided total_amount
            if fixed_amounts:
                sum_fixed = sum(fixed_amounts)
                if sum_fixed > total_amount:
                    raise serializers.ValidationError(
                        f"Sum of fixed amounts ({sum_fixed}) exceeds total_amount ({total_amount})."
                    )

        return data

    def create(self, validated_data):
        from vouchers.services import (
            create_voucher_from_multiple_campaigns,
        )

        health_issue = validated_data.pop("health_issue")
        hospital = validated_data.pop("hospital")
        total_amount = validated_data.pop("total_amount")
        campaign_allocations = validated_data.pop("campaign_allocations")

        voucher, message = create_voucher_from_multiple_campaigns(
            health_issue=health_issue,
            hospital=hospital,
            total_amount=total_amount,
            campaign_allocations=campaign_allocations,
        )

        if not voucher:
            raise serializers.ValidationError(message)

        return voucher
