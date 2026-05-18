from hospitals.models import MedicalClaim, ClaimItem, MedicalClaimProof,MedicalClaimEvent,MedicalClaimProofEvent
from rest_framework import serializers
from django.db import transaction


class MedicalClaimEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = MedicalClaimEvent
        exclude = ["medical_claim"]

class MedicalClaimProofEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = MedicalClaimProofEvent
        exclude = ["medical_claim_proof"]

class ClaimItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClaimItem
        fields = ["id", "name", "amount"]


class ClaimItemCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating individual claim items without medical_claim field."""

    class Meta:
        model = ClaimItem
        fields = ["name", "amount"]


class MedicalClaimProofSerializer(serializers.ModelSerializer):
    """Serializer for viewing proof documents."""

    class Meta:
        model = MedicalClaimProof
        fields = ["id", "file", "document_type", "verification_status", "uploaded_at"]
        read_only_fields = ["id", "uploaded_at", "verification_status"]


class MedicalClaimProofCreateSerializer(serializers.ModelSerializer):
    """Serializer for uploading proof documents to a claim."""

    class Meta:
        model = MedicalClaimProof
        fields = ["file", "document_type"]

    def create(self, validated_data):
        # uploaded_by and medical_claim are set by the view
        return MedicalClaimProof.objects.create(**validated_data)


class MedicalClaimDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer for viewing medical claims with nested items."""

    claim_items = ClaimItemSerializer(many=True, read_only=True)
    proofs = MedicalClaimProofSerializer(many=True, read_only=True)

    class Meta:
        model = MedicalClaim
        fields = [
            "id",
            "voucher",
            "hospital",
            "service_description",
            "total_cost",
            "claim_status",
            "submitted_at",
            "submitted_by",
            "reviewed_at",
            "reviewed_by",
            "service_completed_at",
            "rejection_reason",
            "claim_items",
            "proofs",
        ]
        read_only_fields = [
            "id",
            "submitted_at",
            "submitted_by",
            "reviewed_at",
            "reviewed_by",
            "service_completed_at",
            "rejection_reason",
        ]


class MedicalClaimCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a medical claim with initial items."""

    claim_items = ClaimItemCreateSerializer(many=True, write_only=True)

    class Meta:
        model = MedicalClaim
        fields = [
            "id",
            "voucher",
            "hospital",
            "service_description",
            "claim_items",
        ]
        read_only_fields = ["id"]

    def validate_claim_items(self, value):
        if not value:
            raise serializers.ValidationError(
                "At least one claim item must be provided."
            )
        return value

    @transaction.atomic
    def create(self, validated_data):
        claim_items_data = validated_data.pop("claim_items", [])

        # Create the medical claim
        medical_claim = MedicalClaim.objects.create(**validated_data)

        # Create claim items and calculate total
        total_cost = 0
        for item_data in claim_items_data:
            item = ClaimItem.objects.create(medical_claim=medical_claim, **item_data)
            total_cost += item.amount

        # Update total cost
        medical_claim.total_cost = total_cost
        medical_claim.save()

        return medical_claim


class MedicalClaimAddItemsSerializer(serializers.Serializer):
    """Serializer for adding more items to an existing medical claim."""

    claim_items = ClaimItemCreateSerializer(
        many=True, write_only=True, help_text="List of items to add to the claim"
    )

    def validate_claim_items(self, value):
        if not value:
            raise serializers.ValidationError(
                "At least one claim item must be provided."
            )
        return value

    @transaction.atomic
    def update(self, instance, validated_data):
        claim_items_data = validated_data.get("claim_items", [])
        total_cost = instance.total_cost

        for item_data in claim_items_data:
            item = ClaimItem.objects.create(medical_claim=instance, **item_data)
            total_cost += item.amount

        # Update total cost
        instance.total_cost = total_cost
        instance.save()

        return instance


class MedicalClaimProofVerifySerializer(serializers.Serializer):
    """Serializer for verifying a proof document."""

    pass  # No additional fields needed for verification


class MedicalClaimProofRejectSerializer(serializers.Serializer):
    """Serializer for rejecting a proof document with a reason."""

    rejection_reason = serializers.CharField(
        max_length=1000, help_text="Reason for rejecting the proof document"
    )


class MedicalClaimProofFlagSerializer(serializers.Serializer):
    """Serializer for flagging a proof document for review with a reason."""

    rejection_reason = serializers.CharField(
        max_length=1000, help_text="Reason for flagging the proof document for review"
    )
