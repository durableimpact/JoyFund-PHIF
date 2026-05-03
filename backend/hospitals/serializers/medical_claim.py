from hospitals.models import MedicalClaim, ClaimItem, MedicalClaimProof
from rest_framework import serializers
from django.db import transaction


class ClaimItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClaimItem
        fields = ['id', 'name', 'amount']


class MedicalClaimProofSerializer(serializers.ModelSerializer):
    class Meta:
        model = MedicalClaimProof
        fields = ['id', 'document', 'uploaded_at']


class MedicalClaimSerializer(serializers.ModelSerializer):
    claim_items = ClaimItemSerializer(many=True, read_only=True)
    proofs = MedicalClaimDocumentSerializer(many=True, read_only=True)

    class Meta:
        model = MedicalClaim
        fields = ['id', 'voucher', 'hospital', 'service_description', 'total_cost', 'claim_status', 'submitted_at', 'reviewed_at', 'claim_items', 'proofs']


class MedicalClaimCreateUpdateSerializer(serializers.ModelSerializer):
    claim_items = ClaimItemSerializer(many=True)

    class Meta:
        model = MedicalClaim
        fields = ['id', 'voucher', 'hospital', 'service_description', 'total_cost', 'claim_status', 'submitted_at', 'reviewed_at', 'claim_items']

    @transaction.atomic
    def create(self, validated_data):
        claim_items_data = validated_data.pop('claim_items', [])
        medical_claim = MedicalClaim.objects.create(**validated_data)
        for item_data in claim_items_data:
            ClaimItem.objects.create(medical_claim=medical_claim, **item_data)
        return medical_claim

    @transaction.atomic
    def update(self, instance, validated_data):
        claim_items_data = validated_data.pop('claim_items', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if claim_items_data is not None:
            instance.claim_items.all().delete()
            for item_data in claim_items_data:
                ClaimItem.objects.create(medical_claim=instance, **item_data)

        return instance