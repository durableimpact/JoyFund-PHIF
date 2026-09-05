from rest_framework.views import APIView
from rest_framework.generics import CreateAPIView, ListAPIView, RetrieveAPIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, BasePermission
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

from core.cache import cache_response, invalidate_group
from vouchers.models.Voucher import Voucher
from vouchers.serializers.voucher import (
    VoucherCheckSerializer,
    VoucherListSerializer,
    VoucherDetailSerializer,
)
from vouchers.serializers.voucher_create import (
    VoucherCreateSerializer,
    VoucherCreateMultipleCampaignsSerializer,
)
from accounts.models import Role
from vouchers.services import check_in_voucher

VOUCHERS_CACHE_GROUP = 'vouchers'
VOUCHERS_CACHE_TIMEOUT = 60

class IsReceptionist(IsAuthenticated):
    def has_permission(self, request, view):
        return (
            super().has_permission(request, view)
            and request.user.role == Role.RECEPTIONIST
        )


class IsSystemAdmin(BasePermission):
    message = "Only System Administrators can perform this action."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == Role.SYSTEM_ADMIN
        )


class CanViewVouchers(BasePermission):
    message = "Only staff members can view vouchers."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role
            in {
                Role.SYSTEM_ADMIN,
                Role.HOSPITAL_ADMIN,
                Role.RECEPTIONIST,
                Role.SOCIAL_WORKER,
            }
        )


class VoucherCheckView(APIView):
    """
    Check if a voucher is active by its code.
    Accessible by Receptionists.
    """

    permission_classes = [IsReceptionist]

    @swagger_auto_schema(
        tags=["Vouchers"],
        manual_parameters=[
            openapi.Parameter(
                "code",
                openapi.IN_QUERY,
                description="Voucher code to check",
                type=openapi.TYPE_STRING,
                required=True,
            )
        ],
        responses={
            200: VoucherCheckSerializer,
            404: "Voucher not found",
            400: "Code parameter missing",
        },
        operation_description="Check if a voucher is active. Returns beneficiary and voucher details if found.",
    )
    def get(self, request):
        code = request.query_params.get("code")
        if not code:
            return Response(
                {"detail": "Voucher code is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            # Normalize code to uppercase as generated
            voucher = Voucher.objects.select_related("beneficiary").get(
                voucher_code=code.upper()
            )
            check_in_voucher(voucher, check_by=request.user)
        except Voucher.DoesNotExist:
            return Response(
                {"detail": "Voucher not found."}, status=status.HTTP_404_NOT_FOUND
            )

        serializer = VoucherCheckSerializer(voucher)
        return Response(serializer.data)


class VoucherCreateView(CreateAPIView):
    """
    Create a new voucher for a validated health issue.
    Admin manually provides hospital, campaign, and amount.
    """

    permission_classes = [IsSystemAdmin]
    serializer_class = VoucherCreateSerializer

    @swagger_auto_schema(
        tags=["Vouchers"],
        operation_description="Manually create a voucher and allocate funds for a validated health issue.",
        responses={
            201: VoucherCreateSerializer,
            400: "Validation error (e.g., insufficient funds, already has voucher)",
        },
    )
    def post(self, request, *args, **kwargs):
        return super().post(request, *args, **kwargs)

    def perform_create(self, serializer):
        super().perform_create(serializer)
        invalidate_group(VOUCHERS_CACHE_GROUP)


class VoucherCreateMultipleCampaignsView(CreateAPIView):
    """
    Create a voucher funded by multiple campaigns.
    Admin specifies campaign contributions as fixed amounts or percentages.
    """

    permission_classes = [IsSystemAdmin]
    serializer_class = VoucherCreateMultipleCampaignsSerializer

    @swagger_auto_schema(
        tags=["Vouchers"],
        operation_description="Create a voucher funded by multiple campaigns. Admin specifies campaign contributions.",
        responses={
            201: VoucherCreateMultipleCampaignsSerializer,
            400: "Validation error",
        },
    )
    def post(self, request, *args, **kwargs):
        return super().post(request, *args, **kwargs)

    def perform_create(self, serializer):
        super().perform_create(serializer)
        invalidate_group(VOUCHERS_CACHE_GROUP)


class VoucherListView(ListAPIView):
    """
    List vouchers with filtering.
    System Admin sees all, Receptionists simplified list.
    """

    permission_classes = [IsAuthenticated, CanViewVouchers]
    serializer_class = VoucherListSerializer

    def get_queryset(self):
        user = self.request.user
        queryset = Voucher.objects.select_related("beneficiary", "hospital").all()

        if user.role == Role.RECEPTIONIST:
            # Receptionists only see vouchers for their hospital
            if hasattr(user, 'receptionist') and user.receptionist.hospital:
                queryset = queryset.filter(hospital=user.receptionist.hospital)
            else:
                queryset = queryset.none()
        elif user.role == Role.HOSPITAL_ADMIN:
            # Hospital Admins only see vouchers for their hospital
            if hasattr(user, 'hospitaladmin') and user.hospitaladmin.hospital:
                queryset = queryset.filter(hospital=user.hospitaladmin.hospital)
            else:
                queryset = queryset.none()

        # Filtering
        status_filter = self.request.query_params.get("status")
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        hospital_filter = self.request.query_params.get("hospital")
        if hospital_filter:
            queryset = queryset.filter(hospital=hospital_filter)

        beneficiary_filter = self.request.query_params.get("beneficiary")
        if beneficiary_filter:
            queryset = queryset.filter(beneficiary=beneficiary_filter)

        return queryset.order_by("-created_at")

    @swagger_auto_schema(
        tags=["Vouchers"],
        manual_parameters=[
            openapi.Parameter(
                "status",
                openapi.IN_QUERY,
                description="Filter by status (AVAILABLE, ACTIVE, USED, etc.)",
                type=openapi.TYPE_STRING,
            ),
            openapi.Parameter(
                "hospital",
                openapi.IN_QUERY,
                description="Filter by hospital UUID",
                type=openapi.TYPE_STRING,
            ),
            openapi.Parameter(
                "beneficiary",
                openapi.IN_QUERY,
                description="Filter by beneficiary UUID",
                type=openapi.TYPE_STRING,
            ),
        ],
        operation_description="List vouchers. System Admins see all, Receptionists see their hospital's vouchers.",
    )
    @cache_response(group=VOUCHERS_CACHE_GROUP, timeout=VOUCHERS_CACHE_TIMEOUT)
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)


class VoucherDetailView(RetrieveAPIView):
    """
    Retrieve full voucher details.
    """

    permission_classes = [IsAuthenticated, CanViewVouchers]
    queryset = Voucher.objects.select_related(
        "beneficiary", "hospital", "health_issue", "medical_claim"
    ).prefetch_related("events", "funding_records")
    serializer_class = VoucherDetailSerializer

    @swagger_auto_schema(
        tags=["Vouchers"],
        operation_description="Get full details of a specific voucher.",
    )
    @cache_response(group=VOUCHERS_CACHE_GROUP, timeout=VOUCHERS_CACHE_TIMEOUT)
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)
