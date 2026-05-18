from rest_framework.generics import (
    ListCreateAPIView,
    RetrieveUpdateDestroyAPIView,
    GenericAPIView,
)
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from django.utils import timezone

from beneficiaries.models.health_issue import HealthIssue, HealthIssueStatus, HealthIssueEvent
from beneficiaries.models.document import BeneficiaryDocument
from beneficiaries.serializers.health_issue import (
    HealthIssueSerializer,
    HealthIssueDetailSerializer,
    BeneficiaryDocumentSerializer,
    HealthIssueVerifySerializer,
    HealthIssueRejectSerializer,
)
from beneficiaries.filters.health_issue import HealthIssueFilter
from beneficiaries.views.beneficiary import (
    IsSocialWorker,
    IsSystemAdmin,
    _TAG,
)


class HealthIssueListCreateView(ListCreateAPIView):
    """
    List and create health issues reported for beneficiaries.
    - List: accessible by authenticated users.
    - Create: only SOCIAL_WORKER can report new health issues.
    """
    queryset = HealthIssue.objects.all()
    serializer_class = HealthIssueSerializer
    filterset_class = HealthIssueFilter
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == "GET":
            return HealthIssueDetailSerializer
        return HealthIssueSerializer

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsAuthenticated(), IsSocialWorker()]
        return [IsAuthenticated()]

    @swagger_auto_schema(
        tags=_TAG, responses={200: HealthIssueDetailSerializer(many=True)},
        operation_description="List health issues with optional filtering."
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    @swagger_auto_schema(
        tags=_TAG,
        request_body=HealthIssueSerializer,
        responses={201: HealthIssueDetailSerializer},
        operation_description="Create a new health issue report for a beneficiary."
    )
    def post(self, request, *args, **kwargs):
        return super().post(request, *args, **kwargs)

    def perform_create(self, serializer):
        health_issue = serializer.save()
        HealthIssueEvent.objects.create(
            health_issue=health_issue,
            status=health_issue.status,
            notes="Health issue reported.",
            changed_by=self.request.user,
        )


class HealthIssueDetailView(RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update, or delete a specific health issue.
    - Retrieve: accessible by authenticated users.
    - Update/Delete: only SYSTEM_ADMIN can modify health issue records.
    """
    queryset = HealthIssue.objects.all()
    serializer_class = HealthIssueSerializer
    lookup_field = "id"

    def get_serializer_class(self):
        if self.request.method == "GET":
            return HealthIssueDetailSerializer
        return HealthIssueSerializer

    def get_permissions(self):
        if self.request.method in ["PUT", "PATCH", "DELETE"]:
            return [IsAuthenticated(), IsSystemAdmin()]
        return [IsAuthenticated()]

    @swagger_auto_schema(tags=_TAG, responses={200: HealthIssueDetailSerializer},
                         operation_description="Retrieve full details of a health issue.")
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    @swagger_auto_schema(
        tags=_TAG,
        request_body=HealthIssueSerializer,
        responses={200: HealthIssueDetailSerializer},
        operation_description="Partially update health issue details (System Admin only)."
    )
    def patch(self, request, *args, **kwargs):
        kwargs["partial"] = True
        return super().patch(request, *args, **kwargs)

    @swagger_auto_schema(
        tags=_TAG,
        request_body=HealthIssueSerializer,
        responses={200: HealthIssueDetailSerializer},
        operation_description="Replace health issue details entirely (System Admin only)."
    )
    def put(self, request, *args, **kwargs):
        return super().put(request, *args, **kwargs)

    def perform_update(self, serializer):
        old_status = serializer.instance.status
        health_issue = serializer.save()
        if old_status != health_issue.status:
            HealthIssueEvent.objects.create(
                health_issue=health_issue,
                status=health_issue.status,
                notes=f"Health issue status updated from {old_status} to {health_issue.status}.",
                changed_by=self.request.user,
            )

    @swagger_auto_schema(tags=_TAG, operation_description="Delete a health issue record (System Admin only).")
    def delete(self, request, *args, **kwargs):
        return super().delete(request, *args, **kwargs)


class HealthIssueVerifyView(APIView):
    """Verify and validate a health issue (System Admin only)."""

    permission_classes = [IsSystemAdmin]

    @swagger_auto_schema(
        tags=_TAG,
        operation_description="Verify and validate a health issue. System Admin endpoint.",
        responses={
            200: HealthIssueDetailSerializer,
            404: "Health issue not found",
        },
    )
    def post(self, request, id):
        try:
            health_issue = HealthIssue.objects.get(id=id)
        except HealthIssue.DoesNotExist:
            return Response(
                {"detail": "Health issue not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        old_status = health_issue.status
        health_issue.status = HealthIssueStatus.VALIDATED
        health_issue.validated_by = request.user.systemadmin
        health_issue.rejection_reason = None
        health_issue.save()

        HealthIssueEvent.objects.create(
            health_issue=health_issue,
            status=health_issue.status,
            notes=f"Health issue verified and validated. Status changed from {old_status} to {health_issue.status}.",
            changed_by=request.user,
        )

        return Response(
            HealthIssueDetailSerializer(health_issue).data,
            status=status.HTTP_200_OK,
        )


class HealthIssueRejectView(APIView):
    """Reject a health issue with a reason (System Admin only)."""

    permission_classes = [IsSystemAdmin]

    @swagger_auto_schema(
        tags=_TAG,
        operation_description="Reject a health issue with a reason. System Admin endpoint.",
        request_body=HealthIssueRejectSerializer,
        responses={
            200: HealthIssueDetailSerializer,
            404: "Health issue not found",
            400: "Bad request",
        },
    )
    def post(self, request, id):
        try:
            health_issue = HealthIssue.objects.get(id=id)
        except HealthIssue.DoesNotExist:
            return Response(
                {"detail": "Health issue not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = HealthIssueRejectSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        old_status = health_issue.status
        health_issue.status = HealthIssueStatus.REJECTED
        health_issue.validated_by = request.user.systemadmin
        health_issue.rejection_reason = serializer.validated_data.get("rejection_reason", "")
        health_issue.save()

        HealthIssueEvent.objects.create(
            health_issue=health_issue,
            status=health_issue.status,
            notes=f"Health issue rejected. Reason: {health_issue.rejection_reason}. Status changed from {old_status} to {health_issue.status}.",
            changed_by=request.user,
        )

        return Response(
            HealthIssueDetailSerializer(health_issue).data,
            status=status.HTTP_200_OK,
        )


class HealthIssueStatusActionView(GenericAPIView):
    """
    Action view to validate or reject a health issue.
    Deprecated in favor of explicit Verify and Reject views but kept for backward compatibility.
    """
    queryset = HealthIssue.objects.all()
    serializer_class = HealthIssueDetailSerializer
    permission_classes = [IsAuthenticated, IsSystemAdmin]
    lookup_field = "id"

    @swagger_auto_schema(
        tags=_TAG,
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'action': openapi.Schema(type=openapi.TYPE_STRING, enum=['validate', 'reject'])
            },
            required=['action']
        ),
        responses={200: HealthIssueDetailSerializer},
        operation_description="Validate or reject a reported health issue. Only accessible by SYSTEM_ADMIN.",
    )
    def post(self, request, id):
        health_issue = self.get_object()
        action = request.data.get("action", "").lower()

        old_status = health_issue.status
        if action == "validate":
            health_issue.status = HealthIssueStatus.VALIDATED
            if hasattr(request.user, "systemadmin"):
                health_issue.validated_by = request.user.systemadmin
            notes = f"Health issue validated. Status changed from {old_status} to {health_issue.status}."
        elif action == "reject":
            health_issue.status = HealthIssueStatus.REJECTED
            if hasattr(request.user, "systemadmin"):
                health_issue.validated_by = request.user.systemadmin
            notes = f"Health issue rejected. Status changed from {old_status} to {health_issue.status}."
        else:
            return Response(
                {"detail": "Invalid action. Use 'validate' or 'reject'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        health_issue.save()

        HealthIssueEvent.objects.create(
            health_issue=health_issue,
            status=health_issue.status,
            notes=notes,
            changed_by=request.user,
        )

        return Response(self.get_serializer(health_issue).data)


class BeneficiaryDocumentListCreateView(ListCreateAPIView):
    """
    List and upload documents for beneficiaries.
    - List: accessible by authenticated users.
    - Upload: only SOCIAL_WORKER can upload new documents.
    """
    queryset = BeneficiaryDocument.objects.all()
    serializer_class = BeneficiaryDocumentSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsAuthenticated(), IsSocialWorker()]
        return [IsAuthenticated()]

    @swagger_auto_schema(tags=_TAG, operation_description="List beneficiary documents.")
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    @swagger_auto_schema(tags=_TAG, operation_description="Upload a new beneficiary document.")
    def post(self, request, *args, **kwargs):
        return super().post(request, *args, **kwargs)


class BeneficiaryDocumentDetailView(RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update, or delete a specific beneficiary document.
    - Retrieve: accessible by authenticated users.
    - Update/Delete: only SYSTEM_ADMIN can modify document records.
    """
    queryset = BeneficiaryDocument.objects.all()
    serializer_class = BeneficiaryDocumentSerializer
    lookup_field = "id"

    def get_permissions(self):
        if self.request.method in ["PUT", "PATCH", "DELETE"]:
            return [IsAuthenticated(), IsSystemAdmin()]
        return [IsAuthenticated()]

    @swagger_auto_schema(tags=_TAG, operation_description="Retrieve details of a beneficiary document.")
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    @swagger_auto_schema(tags=_TAG, operation_description="Partially update document info (System Admin only).")
    def patch(self, request, *args, **kwargs):
        kwargs["partial"] = True
        return super().patch(request, *args, **kwargs)

    @swagger_auto_schema(tags=_TAG, operation_description="Replace document info entirely (System Admin only).")
    def put(self, request, *args, **kwargs):
        return super().put(request, *args, **kwargs)

    @swagger_auto_schema(tags=_TAG, operation_description="Delete a beneficiary document (System Admin only).")
    def delete(self, request, *args, **kwargs):
        return super().delete(request, *args, **kwargs)
