import logging

from django.conf import settings
from django.db import transaction as db_transaction
from django.utils import timezone
from drf_yasg.utils import swagger_auto_schema
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.utils.permissions import IsSystemAdmin
from hospitals.models import Hospital
from utils.campay import CamPayManager

from ..models import Disbursement, EscrowAccount, Transaction
from ..serializers.campay import (
    CampayBalanceSerializer,
    CampayDisburseSerializer,
    CampayDisburseResponseSerializer,
)

logger = logging.getLogger(__name__)


class CampayBalanceView(APIView):
    """
    Retrieve the current CamPay wallet balance (total, MTN, Orange).
    Only accessible by System Admins.
    """
    permission_classes = [IsAuthenticated, IsSystemAdmin]

    @swagger_auto_schema(
        tags=['Payments — Campay'],
        operation_summary="Get CamPay Balance",
        operation_description=(
            "Returns the current CamPay application wallet balance "
            "broken down by operator (MTN / Orange).\n\n"
            "**Permissions:** System Admin only"
        ),
        responses={200: CampayBalanceSerializer()},
    )
    def get(self, request):
        campay = CamPayManager(
            app_username=settings.CAMPAY_APP_USERNAME,
            app_password=settings.CAMPAY_APP_PASSWORD,
            environment=settings.CAMPAY_ENVIRONMENT,
        )

        try:
            balance = campay.get_balance()
        except Exception as e:
            logger.error(f"Failed to fetch Campay balance: {e}")
            return Response(
                {"error": f"Failed to fetch Campay balance: {str(e)}"},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        serializer = CampayBalanceSerializer(data={
            "total_balance": balance.get("total_balance", 0),
            "mtn_balance": balance.get("mtn_balance", 0),
            "orange_balance": balance.get("orange_balance", 0),
            "currency": balance.get("currency", "XAF"),
        })
        serializer.is_valid(raise_exception=True)
        return Response(serializer.data)


class CampayDisburseView(APIView):
    """
    Disburse funds via CamPay Mobile Money to a recipient's phone.
    Creates a Disbursement record, a DISBURSEMENT Transaction,
    and deducts the amount from the EscrowAccount balance.
    Only accessible by System Admins.
    """
    permission_classes = [IsAuthenticated, IsSystemAdmin]

    @swagger_auto_schema(
        tags=['Payments — Campay'],
        operation_summary="Disburse via CamPay",
        operation_description=(
            "Sends money via CamPay Mobile Money to a recipient's phone. "
            "On success, a Disbursement record and DISBURSEMENT Transaction "
            "are created, and the EscrowAccount balance is deducted.\n\n"
            "**Permissions:** System Admin only"
        ),
        request_body=CampayDisburseSerializer,
        responses={201: CampayDisburseResponseSerializer()},
    )
    def post(self, request):
        serializer = CampayDisburseSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        amount = serializer.validated_data["amount"]
        phone = serializer.validated_data["phone"]
        description = serializer.validated_data["description"]
        hospital_id = serializer.validated_data.get("hospital")

        # Validate phone via CamPayManager
        campay = CamPayManager(
            app_username=settings.CAMPAY_APP_USERNAME,
            app_password=settings.CAMPAY_APP_PASSWORD,
            environment=settings.CAMPAY_ENVIRONMENT,
        )
        if not campay.validate_phone_number(phone):
            return Response(
                {"error": "Invalid phone number format. Must start with 237 followed by 9 digits."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check demo-mode limit
        if settings.CAMPAY_ENVIRONMENT == "DEV" and float(amount) > 25.00:
            return Response(
                {"error": "In demo mode, maximum disbursement is limited to 25.00 XAF"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Resolve hospital if provided
        hospital = None
        if hospital_id:
            try:
                hospital = Hospital.objects.get(id=hospital_id)
            except Hospital.DoesNotExist:
                return Response(
                    {"error": "Hospital not found."},
                    status=status.HTTP_404_NOT_FOUND,
                )

        # Call Campay API
        try:
            campay_response = campay.disburse_payment(
                amount=amount,
                phone=phone,
                description=description,
                external_reference="",
            )
        except Exception as e:
            logger.error(f"Campay disbursement API call failed: {e}")
            return Response(
                {"error": f"Campay disbursement failed: {str(e)}"},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        if campay_response.get("status") not in ("SUCCESSFUL", "SUCCESS"):
            error_msg = campay_response.get("message", "Campay disbursement was not successful")
            logger.warning(f"Campay disbursement not successful: {campay_response}")
            return Response(
                {"error": error_msg, "details": campay_response},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        # Create disbursement records in a transaction
        with db_transaction.atomic():
            escrow = EscrowAccount.get_instance()

            disbursement = Disbursement.objects.create(
                hospital=hospital,
                amount=amount,
                currency="XAF",
                payment_method=Disbursement.PaymentMethod.MOMO,
                recipient_phone=phone,
                status=Disbursement.Status.COMPLETED,
                external_reference=campay_response.get("reference", ""),
                gateway_transaction_id=campay_response.get("code", ""),
                notes=description,
                created_by=request.user,
                disbursed_at=timezone.now(),
            )

            tx = Transaction.objects.create(
                type="DISBURSEMENT",
                direction=Transaction.Direction.OUT,
                amount=amount,
                currency="XAF",
                status="SUCCESSFUL",
                source=escrow,
                gateway_transaction_id=campay_response.get("reference", ""),
                metadata={
                    "disbursement_id": str(disbursement.id),
                    "campay_reference": campay_response.get("reference", ""),
                    "phone": phone,
                    "description": description,
                    "payment_method": "MOMO",
                    "hospital_id": str(hospital.id) if hospital else None,
                },
            )

            disbursement.transaction = tx
            disbursement.save(update_fields=["transaction"])

            escrow.balance -= amount
            escrow.save(update_fields=["balance"])

        logger.info(
            f"Campay disbursement completed: {amount} XAF to {phone} "
            f"(disbursement={disbursement.id}, tx={tx.id})"
        )

        return Response(
            {
                "status": "SUCCESSFUL",
                "message": "Disbursement completed successfully",
                "disbursement_id": str(disbursement.id),
                "transaction_id": str(tx.id),
                "campay_reference": campay_response.get("reference", ""),
            },
            status=status.HTTP_201_CREATED,
        )
