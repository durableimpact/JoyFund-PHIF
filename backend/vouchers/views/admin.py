from django_filters.rest_framework import DjangoFilterBackend
from drf_yasg.utils import swagger_auto_schema
from rest_framework import generics, permissions, serializers, status
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.response import Response
from rest_framework.views import APIView

from ..filters import CareVoucherFilter, VoucherAssignmentFilter
from ..models import CareVoucher, VoucherAssignment, VoucherAuditLog
from ..serializers.assignment import VoucherAssignmentSerializer
from ..serializers.voucher import CareVoucherDetailSerializer, CareVoucherListSerializer
from ..engine import approve_assignment
from accounts.utils.permissions import IsAdminOrSocialWorker


class VoucherAssignmentListView(generics.ListAPIView):
    """
    Provides a read-only list of all voucher assignments.
    Accessible by Admins and Social Workers.
    """
    queryset = VoucherAssignment.objects.select_related(
        'beneficiary', 'campaign', 'hospital', 'service', 'assigned_to', 'approved_by'
    ).order_by('-matched_at')
    serializer_class = VoucherAssignmentSerializer
    permission_classes = [IsAdminOrSocialWorker]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = VoucherAssignmentFilter
    search_fields = ['beneficiary__full_name', 'beneficiary__digital_health_id']
    ordering_fields = ['matched_at', 'status']
    ordering = ['-matched_at']

    @swagger_auto_schema(
        tags=['Vouchers (Admin)'],
        operation_summary="List all Voucher Assignments"
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)


class ApproveVoucherAssignmentView(APIView):
    """
    An endpoint for an admin or authorized user to approve a voucher assignment.
    """
    permission_classes = [IsAdminOrSocialWorker]

    @swagger_auto_schema(
        tags=['Vouchers (Admin)'],
        operation_summary="Approve a Pending Voucher Assignment",
        responses={
            200: "Assignment approved successfully.",
            400: "Assignment cannot be approved.",
            404: "Assignment not found."
        }
    )
    def post(self, request, assignment_id, *args, **kwargs):
        """
        Approves a pending voucher assignment, creating the CareVoucher and
        triggering the SMS notification to the beneficiary.
        """
        try:
            assignment = VoucherAssignment.objects.get(id=assignment_id)
        except VoucherAssignment.DoesNotExist:
            return Response(
                {"error": "Voucher assignment not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        if assignment.status != VoucherAssignment.Status.PENDING_APPROVAL:
            return Response(
                {"error": f"This assignment cannot be approved. Its status is '{assignment.get_status_display()}'."},
                status=status.HTTP_400_BAD_REQUEST
            )

        voucher, message = approve_assignment(assignment_id=assignment.id, admin_user=request.user)

        if voucher:
            return Response(
                {
                    "success": True,
                    "message": message,
                    "voucher_code": voucher.voucher_code,
                    "beneficiary": voucher.beneficiary.digital_health_id,
                },
                status=status.HTTP_200_OK
            )
        else:
            # The engine function will have logged the specific error
            return Response(
                {"error": message},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class FlagVoucherAssignmentView(APIView):
    """
    An endpoint for an admin to flag a suspicious voucher assignment for review.
    """
    permission_classes = [IsAdminOrSocialWorker]

    @swagger_auto_schema(
        tags=['Vouchers (Admin)'],
        operation_summary="Flag a Pending Voucher Assignment",
        request_body=serializers.Serializer(
            {"reason": serializers.CharField()}
        ),
        responses={
            200: "Assignment flagged successfully.",
            400: "Assignment cannot be flagged.",
            404: "Assignment not found."
        }
    )
    def post(self, request, assignment_id, *args, **kwargs):
        reason = request.data.get('reason')
        if not reason:
            return Response({"error": "A reason is required to flag an assignment."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            assignment = VoucherAssignment.objects.get(id=assignment_id, status=VoucherAssignment.Status.PENDING_APPROVAL)
        except VoucherAssignment.DoesNotExist:
            return Response({"error": "Pending assignment not found."}, status=status.HTTP_404_NOT_FOUND)

        assignment.status = VoucherAssignment.Status.FLAGGED
        assignment.flag_reason = reason
        assignment.save()

        VoucherAuditLog.objects.create(
            action=VoucherAuditLog.Action.FLAGGED,
            performed_by=request.user,
            notes=f"Assignment for {assignment.beneficiary.digital_health_id} flagged by {request.user.username}. Reason: {reason}"
        )

        return Response({"success": True, "message": "Assignment has been flagged for review."}, status=status.HTTP_200_OK)


class CareVoucherListView(generics.ListAPIView):
    """
    Provides a read-only list of all issued Care Vouchers.
    Accessible by Admins and Social Workers.
    """
    queryset = CareVoucher.objects.select_related('beneficiary', 'hospital').order_by('-created_at')
    serializer_class = CareVoucherListSerializer
    permission_classes = [IsAdminOrSocialWorker]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = CareVoucherFilter
    search_fields = ['beneficiary__full_name', 'beneficiary__digital_health_id', 'voucher_code']
    ordering_fields = ['created_at', 'status']
    ordering = ['-created_at']

    @swagger_auto_schema(
        tags=['Vouchers (Admin)'],
        operation_summary="List all Care Vouchers"
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)


class CareVoucherDetailView(generics.RetrieveAPIView):
    """
    Provides detailed information and a full audit trail for a single Care Voucher.
    """
    queryset = CareVoucher.objects.all()
    serializer_class = CareVoucherDetailSerializer
    permission_classes = [IsAdminOrSocialWorker]
    lookup_field = 'id'

    @swagger_auto_schema(
        tags=['Vouchers (Admin)'],
        operation_summary="Get Care Voucher Details"
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)
