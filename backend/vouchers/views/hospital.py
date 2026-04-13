from django.core.cache import cache
from django.utils import timezone
from rest_framework import status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_yasg.utils import swagger_auto_schema

from ..models import CareVoucher, VoucherAuditLog
from ..serializers.hospital import (
    VoucherCheckInSerializer, VoucherCheckInResponseSerializer,
    VoucherRedeemSerializer, VoucherRedeemResponseSerializer,
)
from accounts.utils.permissions import IsHospitalStaff


class CacheInvalidator:
    """Helper class to invalidate voucher-related caches"""
    @staticmethod
    def invalidate_voucher_caches(voucher_id=None):
        """Invalidate all voucher-related list and detail caches"""
        cache.delete('care_voucher_list')
        cache.delete('voucher_assignment_list')
        if voucher_id:
            cache.delete(f'care_voucher_detail_{voucher_id}')


class VoucherCheckInView(APIView):
    """
    An endpoint for hospital staff to validate a beneficiary's voucher upon arrival.
    This action 'locks' the voucher, reserving the funds for this specific visit.
    """
    permission_classes = [permissions.IsAuthenticated, IsHospitalStaff]
    serializer_class = VoucherCheckInSerializer

    @swagger_auto_schema(
        tags=['Vouchers (Hospital)'],
        operation_summary="Check-In a Voucher",
        request_body=VoucherCheckInSerializer,
        responses={
            200: VoucherCheckInResponseSerializer,
            400: "Invalid voucher status or code.",
            404: "Voucher not found."
        }
    )
    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        voucher_code = serializer.validated_data['voucher_code']

        try:
            voucher = CareVoucher.objects.get(voucher_code__iexact=voucher_code)
        except CareVoucher.DoesNotExist:
            return Response(
                {"error": "Invalid voucher code."},
                status=status.HTTP_404_NOT_FOUND
            )

        if voucher.status != CareVoucher.Status.AVAILABLE:
            return Response(
                {"error": f"This voucher cannot be used. Its current status is '{voucher.get_status_display()}'."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Lock the voucher
        voucher.status = CareVoucher.Status.LOCKED
        voucher.locked_at = timezone.now()
        voucher.save()

        VoucherAuditLog.objects.create(
            voucher=voucher,
            action=VoucherAuditLog.Action.LOCKED,
            performed_by=request.user,
            notes=f"Voucher checked in by {request.user.email} at hospital."
        )

        # Invalidate voucher caches
        CacheInvalidator.invalidate_voucher_caches(voucher.id)

        # TODO: Trigger real-time notification to the donor

        return Response(
            {
                "success": True,
                "message": "Voucher successfully checked in and locked.",
                "beneficiary_name": voucher.beneficiary.full_name,
                "service": voucher.service.name,
                "value": voucher.value
            },
            status=status.HTTP_200_OK
        )


class VoucherRedeemView(APIView):
    """
    An endpoint for hospital staff to redeem a voucher after care is provided,
    using the secret PIN provided by the beneficiary. This is the final step
    that confirms service completion and triggers the payout process.
    """
    permission_classes = [permissions.IsAuthenticated, IsHospitalStaff]
    serializer_class = VoucherRedeemSerializer

    @swagger_auto_schema(
        tags=['Vouchers (Hospital)'],
        operation_summary="Redeem a Voucher",
        request_body=VoucherRedeemSerializer,
        responses={
            200: VoucherRedeemResponseSerializer,
            400: "Invalid PIN or voucher status.",
            404: "Voucher not found."
        }
    )
    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        voucher_code = serializer.validated_data['voucher_code']
        pin = serializer.validated_data['patient_confirmation_pin']

        try:
            voucher = CareVoucher.objects.get(voucher_code__iexact=voucher_code)
        except CareVoucher.DoesNotExist:
            return Response(
                {"error": "Invalid voucher code."},
                status=status.HTTP_404_NOT_FOUND
            )

        if voucher.status != CareVoucher.Status.LOCKED:
            return Response(
                {"error": f"This voucher cannot be redeemed. It must be in 'Checked-In' status. Current status: '{voucher.get_status_display()}'."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if voucher.patient_confirmation_pin != pin:
            return Response(
                {"error": "Invalid patient confirmation PIN."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Redeem the voucher
        voucher.status = CareVoucher.Status.REDEEMED
        voucher.redeemed_at = timezone.now()
        voucher.save()

        VoucherAuditLog.objects.create(
            voucher=voucher,
            action=VoucherAuditLog.Action.REDEEMED,
            performed_by=request.user,
            notes=f"Voucher redeemed with patient PIN by {request.user.email}."
        )

        # Invalidate voucher caches
        CacheInvalidator.invalidate_voucher_caches(voucher.id)

        # TODO: Trigger the HospitalPayout creation and fund transfer

        return Response(
            {
                "success": True,
                "message": "Voucher successfully redeemed. Payout process initiated."
            },
            status=status.HTTP_200_OK
        )
