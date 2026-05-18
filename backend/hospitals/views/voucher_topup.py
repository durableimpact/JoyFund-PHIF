from rest_framework.generics import (
    CreateAPIView,
    ListAPIView,
    RetrieveAPIView,
)
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView
from drf_yasg.utils import swagger_auto_schema

from utils.serializers import ErrorResponseSerializer
from hospitals.models import VoucherTopUpRequest,VoucherTopUpRequestEvent
from hospitals.serializers.voucher_topup import (
    VoucherTopUpRequestSerializer,
    VoucherTopUpRequestCreateSerializer,
    VoucherTopUpRequestApproveSerializer,
    VoucherTopUpRequestRejectSerializer,
)
from hospitals.services.voucher_topup import (
    approve_top_up_request_and_allocate_funds,
    reject_top_up_request,
)
from .medical_claim import IsReceptionist, IsSystemAdmin


class VoucherTopUpRequestCreateView(CreateAPIView):
    """Receptionist submits a request for additional voucher funding."""

    permission_classes = [IsReceptionist]
    serializer_class = VoucherTopUpRequestCreateSerializer

    @swagger_auto_schema(
        tags=["Voucher Top-Up"],
        operation_description="Submit a top-up request for insufficient voucher funding.",
        responses={201: VoucherTopUpRequestSerializer, 400: ErrorResponseSerializer},
    )
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {"detail": serializer.errors, "error_code": "VALIDATION_ERROR"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        top_up_request = serializer.save()
        VoucherTopUpRequestEvent.objects.create(
            voucher_top_up_request=top_up_request,
            status=top_up_request.status,
            changed_by=request.user,
            notes=f"Voucher top-up request created. Amount: {top_up_request.requested_amount} XAF. Reason: {top_up_request.reason}",
        )
        return Response(
            VoucherTopUpRequestSerializer(top_up_request).data,
            status=status.HTTP_201_CREATED,
        )


class VoucherTopUpRequestApproveView(APIView):
    """System Admin approves top-up and allocates funds from campaigns."""

    permission_classes = [IsSystemAdmin]

    @swagger_auto_schema(
        tags=["Voucher Top-Up"],
        operation_description="Approve a top-up request and allocate funds from campaigns.",
        request_body=VoucherTopUpRequestApproveSerializer,
        responses={
            200: VoucherTopUpRequestSerializer,
            400: ErrorResponseSerializer,
            404: ErrorResponseSerializer,
        },
    )
    def post(self, request, top_up_request_id):
        try:
            top_up_request = VoucherTopUpRequest.objects.get(id=top_up_request_id)
        except VoucherTopUpRequest.DoesNotExist:
            return Response(
                {
                    "detail": "Top-up request not found.",
                    "error_code": "TOPUP_REQUEST_NOT_FOUND",
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = VoucherTopUpRequestApproveSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {"detail": serializer.errors, "error_code": "VALIDATION_ERROR"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        success, message = approve_top_up_request_and_allocate_funds(
            top_up_request=top_up_request,
            system_admin=request.user.system_admin,
            campaign_allocations=serializer.validated_data["campaign_allocations"],
            review_notes=serializer.validated_data.get("review_notes", ""),
        )

        if not success:
            return Response(
                {"detail": message, "error_code": "APPROVAL_FAILED"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        VoucherTopUpRequestEvent.objects.create(
            voucher_top_up_request=top_up_request,
            status=top_up_request.status,
            changed_by=request.user,
            notes=f"Voucher top-up request approved. Review notes: {serializer.validated_data.get('review_notes', '')}",
        )

        return Response(
            VoucherTopUpRequestSerializer(top_up_request).data,
            status=status.HTTP_200_OK,
        )


class VoucherTopUpRequestRejectView(APIView):
    """System Admin rejects top-up with a reason."""

    permission_classes = [IsSystemAdmin]

    @swagger_auto_schema(
        tags=["Voucher Top-Up"],
        operation_description="Reject a voucher top-up request.",
        request_body=VoucherTopUpRequestRejectSerializer,
        responses={
            200: VoucherTopUpRequestSerializer,
            400: ErrorResponseSerializer,
            404: ErrorResponseSerializer,
        },
    )
    def post(self, request, top_up_request_id):
        try:
            top_up_request = VoucherTopUpRequest.objects.get(id=top_up_request_id)
        except VoucherTopUpRequest.DoesNotExist:
            return Response(
                {
                    "detail": "Top-up request not found.",
                    "error_code": "TOPUP_REQUEST_NOT_FOUND",
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = VoucherTopUpRequestRejectSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {"detail": serializer.errors, "error_code": "VALIDATION_ERROR"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        success, message = reject_top_up_request(
            top_up_request=top_up_request,
            system_admin=request.user.system_admin,
            review_notes=serializer.validated_data["review_notes"],
        )

        if not success:
            return Response(
                {"detail": message, "error_code": "REJECTION_FAILED"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        VoucherTopUpRequestEvent.objects.create(
            voucher_top_up_request=top_up_request,
            status=top_up_request.status,
            changed_by=request.user,
            notes=f"Voucher top-up request rejected. Reason: {serializer.validated_data['review_notes']}",
        )

        return Response(
            VoucherTopUpRequestSerializer(top_up_request).data,
            status=status.HTTP_200_OK,
        )


class VoucherTopUpRequestListView(ListAPIView):
    """List all voucher top-up requests."""

    permission_classes = [IsAuthenticated]
    serializer_class = VoucherTopUpRequestSerializer
    queryset = VoucherTopUpRequest.objects.prefetch_related("events").order_by("-created_at")

    @swagger_auto_schema(
        tags=["Voucher Top-Up"],
        operation_description="List all voucher top-up requests.",
        responses={200: VoucherTopUpRequestSerializer(many=True)},
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)


class VoucherTopUpRequestDetailView(RetrieveAPIView):
    """Retrieve a specific voucher top-up request."""

    permission_classes = [IsAuthenticated]
    serializer_class = VoucherTopUpRequestSerializer
    queryset = VoucherTopUpRequest.objects.all()
    lookup_field = "id"
    lookup_url_kwarg = "top_up_request_id"

    @swagger_auto_schema(
        tags=["Voucher Top-Up"],
        operation_description="Retrieve details of a specific voucher top-up request.",
        responses={200: VoucherTopUpRequestSerializer, 404: ErrorResponseSerializer},
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)
