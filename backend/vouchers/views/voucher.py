from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

from vouchers.models.Voucher import Voucher
from vouchers.serializers.voucher import VoucherCheckSerializer
from accounts.models import Role


class IsReceptionist(IsAuthenticated):
    def has_permission(self, request, view):
        return (
            super().has_permission(request, view)
            and request.user.role == Role.RECEPTIONIST
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
        except Voucher.DoesNotExist:
            return Response(
                {"detail": "Voucher not found."}, status=status.HTTP_404_NOT_FOUND
            )

        serializer = VoucherCheckSerializer(voucher)
        return Response(serializer.data)
