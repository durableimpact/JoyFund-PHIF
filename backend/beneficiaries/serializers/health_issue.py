from rest_framework import serializers
from beneficiaries.models.health_issue import HealthIssue,HealthIssueEvent
from beneficiaries.models.document import BeneficiaryDocument
from accounts.serializers.social_worker import (
    SocialWorkerMinimalSerializer,
    SystemAdminMinimalSerializer,
)

class HealthIssueEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = HealthIssueEvent
        exclude = ["health_issue"]


class HealthIssueSerializer(serializers.ModelSerializer):
    class Meta:
        model = HealthIssue
        fields = "__all__"
        read_only_fields = ["created_at", "updated_at", "social_worker"]

    def create(self, validated_data):
        request = self.context.get("request")
        if request and hasattr(request.user, "socialworker"):
            validated_data["social_worker"] = request.user.socialworker
        return super().create(validated_data)


class HealthIssueDetailSerializer(serializers.ModelSerializer):
    social_worker = SocialWorkerMinimalSerializer(read_only=True)
    validated_by = SystemAdminMinimalSerializer(read_only=True)
    events = HealthIssueEventSerializer(many=True, read_only=True)

    class Meta:
        model = HealthIssue
        fields = "__all__"
        read_only_fields = ["created_at", "updated_at"]


class BeneficiaryDocumentSerializer(serializers.ModelSerializer):
    documents = serializers.ListField(
        child=serializers.FileField(max_length=100000, allow_empty_file=False, use_url=False),
        write_only=True,
        required=False,
    )

    class Meta:
        model = BeneficiaryDocument
        fields = ["id", "document", "documents", "description", "uploaded_at"]
        read_only_fields = ["uploaded_at"]

    def validate(self, data):
        if "documents" not in data and "document" not in data:
            raise serializers.ValidationError("Must provide either 'document' (single file) or 'documents' (list of files).")
        return data

    def create(self, validated_data):
        beneficiary = validated_data.pop("beneficiary")
        description = validated_data.pop("description", "")
        single_file = validated_data.pop("document", None)
        multiple_files = validated_data.pop("documents", None)

        files = []
        if multiple_files:
            files = multiple_files
        elif single_file:
            files = [single_file]

        created = []
        for f in files:
            doc = BeneficiaryDocument.objects.create(
                beneficiary=beneficiary,
                document=f,
                description=description,
            )
            created.append(doc)
        return created


class HealthIssueVerifySerializer(serializers.Serializer):
    """Serializer for verifying a health issue."""

    pass  # No additional fields needed for verification


class HealthIssueRejectSerializer(serializers.Serializer):
    """Serializer for rejecting a health issue with a reason."""

    rejection_reason = serializers.CharField(
        max_length=1000, help_text="Reason for rejecting the health issue"
    )
