from rest_framework import serializers

from beneficiaries.models import Beneficiary
from beneficiaries.models.document import BeneficiaryDocument
from beneficiaries.serializers.health_issue import (
    BeneficiaryDocumentSerializer,
    HealthIssueSerializer,
)


class BeneficiaryDetailSerializer(serializers.ModelSerializer):
    enrolled_by_id = serializers.UUIDField(source="enrolled_by.id", read_only=True)
    documents = BeneficiaryDocumentSerializer(many=True, read_only=True)
    health_issues = HealthIssueSerializer(many=True, read_only=True)

    class Meta:
        model = Beneficiary
        fields = [
            "id",
            "digital_health_id",
            "full_name",
            "date_of_birth",
            "gender",
            "category",
            "phone",
            "email",
            "region",
            "city",
            "address",
            "national_id_number",
            "emergency_contact_name",
            "emergency_contact_phone",
            "emergency_contact_relationship",
            "enrolled_by_id",
            "created_at",
            "documents",
            "health_issues",
        ]


class BeneficiaryCreateSerializer(serializers.ModelSerializer):
    uploaded_documents = serializers.ListField(
        child=serializers.FileField(
            max_length=100000, allow_empty_file=False, use_url=False
        ),
        write_only=True,
        required=False,
    )

    class Meta:
        model = Beneficiary
        exclude = ["enrolled_by", "created_at", "updated_at"]

    def create(self, validated_data):
        uploaded_documents = validated_data.pop("uploaded_documents", [])
        enrolled_by = self.context["enrolled_by"]

        beneficiary = Beneficiary.objects.create(
            enrolled_by=enrolled_by, **validated_data
        )

        for doc in uploaded_documents:
            BeneficiaryDocument.objects.create(beneficiary=beneficiary, document=doc)

        return beneficiary

    def to_representation(self, instance):
        return BeneficiaryDetailSerializer(instance).data


class BeneficiaryUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Beneficiary
        exclude = ["enrolled_by", "created_at", "updated_at"]

    def to_representation(self, instance):
        return BeneficiaryDetailSerializer(instance).data
