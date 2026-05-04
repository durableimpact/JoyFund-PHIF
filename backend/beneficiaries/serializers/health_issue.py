from rest_framework import serializers
from beneficiaries.models.health_issue import HealthIssue
from beneficiaries.models.document import BeneficiaryDocument
from accounts.serializers.social_worker import (
    SocialWorkerMinimalSerializer,
    SystemAdminMinimalSerializer,
)


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

    class Meta:
        model = HealthIssue
        fields = "__all__"
        read_only_fields = ["created_at", "updated_at"]


class BeneficiaryDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = BeneficiaryDocument
        fields = ["id", "document", "description", "uploaded_at"]
        read_only_fields = ["uploaded_at"]
