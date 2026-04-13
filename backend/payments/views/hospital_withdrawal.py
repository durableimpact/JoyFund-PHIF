from drf_yasg.utils import swagger_auto_schema
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db import transaction
from django.conf import settings
import uuid

from accounts.utils.permissions import IsHospitalAdmin
from ..models import HospitalAccount, Transaction
from ..serializers.hospital_withdrawal import HospitalWithdrawalSerializer
from utils.campay import CamPayManager

class HospitalWithdrawalView(APIView):
    """
    Allow a hospital admin to withdraw money from their associated HospitalAccount.
    """
    permission_classes = [IsHospitalAdmin]
    serializer_class = HospitalWithdrawalSerializer

    @swagger_auto_schema(
        tags=['Payments — Withdrawals'],
        operation_summary="Hospital Admin Withdrawal",
        operation_description="Withdraws a specified amount from the authenticated Hospital Admin's HospitalAccount using Campay. Funds are locked pending the webhoook response.",
        request_body=HospitalWithdrawalSerializer,
        responses={200: "Withdrawal initiated", 400: "Insufficient funds or bad request", 403: "No associated hospital account"}
    )
    def post(self, request, *args, **kwargs):
        user = request.user
        
        # Determine the hospital associated with this hospital admin
        try:
            hospital_admin = user.hospitaladmin
            hospital = hospital_admin.hospital
        except Exception:
            return Response(
                {"error": "User is not a valid Hospital Admin or has no associated hospital."},
                status=status.HTTP_403_FORBIDDEN
            )
            
        if not hospital:
            return Response(
                {"error": "No hospital assigned to this account."},
                status=status.HTTP_403_FORBIDDEN
            )
            
        if not hospital.momo_number:
            return Response(
                {"error": "This hospital does not have a registered MoMo number."},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # Get their internal ledger account
        try:
            hospital_account = hospital.ledger_account
        except HospitalAccount.DoesNotExist:
            return Response(
                {"error": "This hospital does not have an active ledger account."},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = self.serializer_class(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        amount = serializer.validated_data['amount']
        
        if hospital_account.balance < amount:
            return Response(
                {"error": f"Insufficient funds. Current balance is {hospital_account.balance} XAF."},
                status=status.HTTP_400_BAD_REQUEST
            )

        with transaction.atomic():
            # 1. Deduct amount from hospital account immediately (lock funds)
            hospital_account.balance -= amount
            hospital_account.save()
            
            # 2. Record the DISBURSEMENT transaction
            disbursement_tx = Transaction.objects.create(
                type='DISBURSEMENT',
                direction=Transaction.Direction.OUT,
                amount=amount,
                status='PENDING',
                source=hospital_account,
                metadata={'campay_note': serializer.validated_data.get('note', '')}
            )

        try:
            campay_manager = CamPayManager(
                app_username=settings.CAMPAY_APP_USERNAME,
                app_password=settings.CAMPAY_APP_PASSWORD,
                environment=settings.CAMPAY_ENVIRONMENT
            )
            
            # Format phone number for Campay (must start with 237)
            phone = hospital.momo_number
            if not phone.startswith("237"):
                # Simple normalization (assumes mostly valid numbers)
                phone = f"237{phone.lstrip('+')}"
                
            # Trigger external disbursement
            # We use the transaction id as the external reference
            response = campay_manager.disburse_payment(
                amount=amount,
                phone=phone,
                description=f"Disbursement for {hospital.name}",
                external_reference=str(disbursement_tx.id)
            )
            
            # If standard response format from Campay
            reference = response.get('reference', '')
            if reference:
                disbursement_tx.gateway_transaction_id = reference
                disbursement_tx.save()

            return Response({
                "message": f"Successfully initiated withdrawal of {amount} XAF.",
                "remaining_balance": hospital_account.balance,
                "transaction_id": disbursement_tx.id,
                "campay_reference": reference
            }, status=status.HTTP_200_OK)

        except Exception as e:
            # If the api call fails, we need to rollback the balance manually since we are not in atomic block
            with transaction.atomic():
                hospital_account.balance += amount
                hospital_account.save()
                if 'disbursement_tx' in locals():
                    disbursement_tx.status = 'FAILED'
                    metadata = disbursement_tx.metadata or {}
                    metadata['error'] = str(e)
                    disbursement_tx.metadata = metadata
                    disbursement_tx.save()
            return Response(
                {"error": f"Failed to initiate withdrawal: {str(e)}"},
                status=status.HTTP_502_BAD_GATEWAY
            )
