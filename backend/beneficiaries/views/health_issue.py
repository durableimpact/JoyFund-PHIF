from rest_framework.generics import (
    ListCreateAPIView,
    RetrieveUpdateDestroyAPIView,
    GenericAPIView,
)
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from drf_yasg.utils import swagger_auto_schema

from beneficiaries.models.health_issue import HealthIssue, HealthIssueStatus
from beneficiaries.models.document import BeneficiaryDocument
from beneficiaries.serializers.health_issue import (
    HealthIssueSerializer,
    HealthIssueDetailSerializer,
    BeneficiaryDocumentSerializer,
)
from beneficiaries.filters.health_issue import HealthIssueFilter
from beneficiaries.views.beneficiary import (
    IsSocialWorker,
    IsSystemAdmin,
    _TAG,
)


class HealthIssueListCreateView(ListCreateAPIView):
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
        tags=_TAG, responses={200: HealthIssueDetailSerializer(many=True)}
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    @swagger_auto_schema(
        tags=_TAG,
        request_body=HealthIssueSerializer,
        responses={201: HealthIssueDetailSerializer},
    )
    def post(self, request, *args, **kwargs):
        return super().post(request, *args, **kwargs)


class HealthIssueDetailView(RetrieveUpdateDestroyAPIView):
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

    @swagger_auto_schema(tags=_TAG, responses={200: HealthIssueDetailSerializer})
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    @swagger_auto_schema(
        tags=_TAG,
        request_body=HealthIssueSerializer,
        responses={200: HealthIssueDetailSerializer},
    )
    def patch(self, request, *args, **kwargs):
        kwargs["partial"] = True
        return super().patch(request, *args, **kwargs)

    @swagger_auto_schema(
        tags=_TAG,
        request_body=HealthIssueSerializer,
        responses={200: HealthIssueDetailSerializer},
    )
    def put(self, request, *args, **kwargs):
        return super().put(request, *args, **kwargs)

    @swagger_auto_schema(tags=_TAG)
    def delete(self, request, *args, **kwargs):
        return super().delete(request, *args, **kwargs)


class HealthIssueStatusActionView(GenericAPIView):
    queryset = HealthIssue.objects.all()
    serializer_class = HealthIssueDetailSerializer
    permission_classes = [IsAuthenticated, IsSystemAdmin]
    lookup_field = "id"

    @swagger_auto_schema(
        tags=_TAG,
        responses={200: HealthIssueDetailSerializer},
        operation_description="Validate a reported health issue. Only accessible by SYSTEM_ADMIN.",
    )
    def post(self, request, id, action):
        health_issue = self.get_object()

        if action == "validate":
            health_issue.status = HealthIssueStatus.VALIDATED
            if hasattr(request.user, "systemadmin"):
                health_issue.validated_by = request.user.systemadmin
        elif action == "reject":
            health_issue.status = HealthIssueStatus.REJECTED
            if hasattr(request.user, "systemadmin"):
                health_issue.validated_by = request.user.systemadmin
        else:
            return Response(
                {"detail": "Invalid action. Use 'validate' or 'reject'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        health_issue.save()
        return Response(self.get_serializer(health_issue).data)


class BeneficiaryDocumentListCreateView(ListCreateAPIView):
    queryset = BeneficiaryDocument.objects.all()
    serializer_class = BeneficiaryDocumentSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsAuthenticated(), IsSocialWorker()]
        return [IsAuthenticated()]

    @swagger_auto_schema(tags=_TAG)
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    @swagger_auto_schema(tags=_TAG)
    def post(self, request, *args, **kwargs):
        return super().post(request, *args, **kwargs)


class BeneficiaryDocumentDetailView(RetrieveUpdateDestroyAPIView):
    queryset = BeneficiaryDocument.objects.all()
    serializer_class = BeneficiaryDocumentSerializer
    lookup_field = "id"

    def get_permissions(self):
        if self.request.method in ["PUT", "PATCH", "DELETE"]:
            return [IsAuthenticated(), IsSystemAdmin()]
        return [IsAuthenticated()]

    @swagger_auto_schema(tags=_TAG)
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    @swagger_auto_schema(tags=_TAG)
    def patch(self, request, *args, **kwargs):
        kwargs["partial"] = True
        return super().patch(request, *args, **kwargs)

    @swagger_auto_schema(tags=_TAG)
    def put(self, request, *args, **kwargs):
        return super().put(request, *args, **kwargs)

    @swagger_auto_schema(tags=_TAG)
    def delete(self, request, *args, **kwargs):
        return super().delete(request, *args, **kwargs)
