from drf_yasg.utils import swagger_auto_schema
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework import status
from rest_framework.generics import (
    DestroyAPIView,
    ListAPIView,
    RetrieveAPIView,
    UpdateAPIView,
)
from rest_framework.permissions import BasePermission, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import Role
from beneficiaries.models import Beneficiary
from beneficiaries.filters.beneficiary import BeneficiaryFilter
from beneficiaries.serializers import (
    BeneficiaryCreateSerializer,
    BeneficiaryDetailSerializer,
    BeneficiaryUpdateSerializer,
)

_TAG = ["Beneficiaries"]


class IsSocialWorker(BasePermission):
    message = "Only Social Workers can perform this action."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == Role.SOCIAL_WORKER
        )


class IsSystemAdmin(BasePermission):
    message = "Only System Administrators can perform this action."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == Role.SYSTEM_ADMIN
        )


class IsSocialWorkerOrSystemAdmin(BasePermission):

    message = "Only Social Workers or System Administrators can perform this action."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role in [Role.SOCIAL_WORKER, Role.SYSTEM_ADMIN]
        )

class IsBeneficiaryEnrolledByRequester(BasePermission):
    message = "You can only manage beneficiaries enrolled by your account."

    def has_object_permission(self, request, view, obj):
        # System Admin can see and manage everything
        if request.user.role == Role.SYSTEM_ADMIN:
            return True
        try:
            return obj.enrolled_by_id == request.user.socialworker.id
        except Exception:
            return False


class BeneficiaryCreateView(APIView):
    """
    View to create a new beneficiary profile.
    Only accessible by authenticated Social Workers.
    """
    permission_classes = [IsAuthenticated, IsSocialWorker]

    @swagger_auto_schema(
        tags=_TAG,
        request_body=BeneficiaryCreateSerializer,
        responses={201: BeneficiaryDetailSerializer},
        operation_description="Create a beneficiary profile. Only accessible by SOCIAL_WORKER.",
    )
    def post(self, request):
        try:
            enrolled_by = request.user.socialworker
        except Exception:
            return Response(
                {"detail": "Requesting user does not have a SocialWorker profile."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = BeneficiaryCreateSerializer(
            data=request.data,
            context={"enrolled_by": enrolled_by},
        )
        serializer.is_valid(raise_exception=True)
        beneficiary = serializer.save()
        return Response(
            BeneficiaryDetailSerializer(beneficiary).data,
            status=status.HTTP_201_CREATED,
        )


class BeneficiaryListView(ListAPIView):
    """
    List beneficiaries enrolled by the authenticated social worker.
    Supports filtering, searching, and ordering.
    """
    serializer_class = BeneficiaryDetailSerializer
    permission_classes = [IsAuthenticated, IsSocialWorkerOrSystemAdmin]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = BeneficiaryFilter
    search_fields = [
        "full_name",
        "phone",
        "email",
        "national_id_number",
        "emergency_contact_name",
    ]
    ordering_fields = ["created_at", "updated_at", "full_name", "city", "region"]

    def get_queryset(self):
        # Handle schema generation for Swagger
        if getattr(self, "swagger_fake_view", False):
            return Beneficiary.objects.none()

        return (
            Beneficiary.objects.select_related("enrolled_by__user")
            .filter(enrolled_by__user=self.request.user)
            .order_by("-created_at")
        )

    @swagger_auto_schema(
        tags=_TAG,
        responses={200: BeneficiaryDetailSerializer(many=True)},
        operation_description="List beneficiaries enrolled by the authenticated SOCIAL_WORKER.",
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    @swagger_auto_schema(
        tags=_TAG,
        request_body=BeneficiaryCreateSerializer,
        responses={201: BeneficiaryDetailSerializer},
        operation_description="Create a beneficiary profile. Only accessible by SOCIAL_WORKER.",
    )
    def post(self, request):
        try:
            enrolled_by = request.user.socialworker
        except Exception:
            return Response(
                {"detail": "Requesting user does not have a SocialWorker profile."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = BeneficiaryCreateSerializer(
            data=request.data,
            context={"enrolled_by": enrolled_by},
        )
        serializer.is_valid(raise_exception=True)
        beneficiary = serializer.save()
        return Response(
            BeneficiaryDetailSerializer(beneficiary).data,
            status=status.HTTP_201_CREATED,
        )


class BeneficiaryDetailView(RetrieveAPIView, UpdateAPIView, DestroyAPIView):
    """
    Retrieve, update, or delete a beneficiary profile.
    - Retrieve: Social Worker (enroller) or System Admin.
    - Update/Delete: System Admin only.
    """
    queryset = Beneficiary.objects.select_related("enrolled_by__user")
    serializer_class = BeneficiaryDetailSerializer
    permission_classes = [
        IsAuthenticated,
        IsBeneficiaryEnrolledByRequester,
    ]
    lookup_field = "id"
    http_method_names = ["get", "patch", "delete", "head", "options"]

    def get_permissions(self):
        if self.request.method in ["PATCH", "DELETE"]:
            return [IsAuthenticated(), IsSystemAdmin()]
        return [IsAuthenticated(), IsBeneficiaryEnrolledByRequester()]

    def get_serializer_class(self):
        if self.request.method == "PATCH":
            return BeneficiaryUpdateSerializer
        return BeneficiaryDetailSerializer

    @swagger_auto_schema(
        tags=_TAG,
        responses={200: BeneficiaryDetailSerializer},
        operation_description="Retrieve beneficiary details. Only accessible by the enrolling SOCIAL_WORKER.",
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    @swagger_auto_schema(
        tags=_TAG,
        request_body=BeneficiaryUpdateSerializer,
        responses={200: BeneficiaryDetailSerializer},
        operation_description="Update beneficiary info. Only accessible by SYSTEM_ADMIN.",
    )
    def patch(self, request, *args, **kwargs):
        return super().patch(request, *args, **kwargs)

    @swagger_auto_schema(
        tags=_TAG,
        responses={204: "No Content"},
        operation_description="Delete a beneficiary. Only accessible by SYSTEM_ADMIN.",
    )
    def delete(self, request, *args, **kwargs):
        return super().delete(request, *args, **kwargs)
