from rest_framework.generics import (
    CreateAPIView,
    RetrieveUpdateAPIView,
    ListCreateAPIView,
    RetrieveUpdateDestroyAPIView,
    ListAPIView,
    RetrieveAPIView,
)
from rest_framework.permissions import IsAuthenticated, BasePermission
from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from drf_yasg.utils import swagger_auto_schema
from django.utils import timezone

from core.cache import cache_response, invalidate_group

from hospitals.filters import MedicalClaimFilter

from utils.serializers import ErrorResponseSerializer
from hospitals.models import (
    MedicalClaim,
    MedicalClaimEvent,
    MedicalClaimProof,
    MedicalClaimProofEvent,
)
from hospitals.serializers.medical_claim import (
    MedicalClaimCreateSerializer,
    MedicalClaimDetailSerializer,
    MedicalClaimListSerializer,
    MedicalClaimAddItemsSerializer,
    MedicalClaimProofSerializer,
    MedicalClaimProofCreateSerializer,
    MedicalClaimProofVerifySerializer,
    MedicalClaimProofRejectSerializer,
    MedicalClaimProofFlagSerializer,
)
from hospitals.serializers.voucher_topup import (
    VoucherApproveSerializer,
    VoucherConfirmPinSerializer,
    MedicalClaimApproveSerializer,
    MedicalClaimRejectSerializer,
    MedicalClaimFinalVerifySerializer,
)
from hospitals.services.voucher_topup import (
    mark_claim_service_complete,
    confirm_voucher_pin,
    send_campaign_contributor_notifications,
    approve_voucher,
)
from vouchers.services import settle_voucher_with_campaign_updates
from accounts.models import Role

CLAIMS_CACHE_GROUP = 'medical_claims'
CLAIMS_CACHE_TIMEOUT = 10 


class IsReceptionist(IsAuthenticated):
    """Permission to check if user is a Receptionist."""

    def has_permission(self, request, view):
        return (
            super().has_permission(request, view)
            and request.user.role == Role.RECEPTIONIST
        )


class IsSystemAdmin(IsAuthenticated):
    """Permission to check if user is a System Admin."""

    def has_permission(self, request, view):
        return (
            super().has_permission(request, view)
            and request.user.role == Role.SYSTEM_ADMIN
        )
    
class IsSystemOrHospitalAdminOrReceptionist(BasePermission):
    message = "Only System Admins, Receptionist or Hospital Admins can perform this action."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role in {Role.SYSTEM_ADMIN, Role.HOSPITAL_ADMIN, Role.RECEPTIONIST}
        )

class IsHospitalAdminOrReceptionist(IsAuthenticated):
    """Permission to check if user is a Hospital Admin or Receptionist."""

    def has_permission(self, request, view):
        return (
            super().has_permission(request, view)
            and request.user.role in {Role.HOSPITAL_ADMIN, Role.RECEPTIONIST}
        )


class MedicalClaimCreateView(CreateAPIView):
    """Create a medical claim with initial claim items."""

    permission_classes = [IsReceptionist]
    serializer_class = MedicalClaimCreateSerializer

    @swagger_auto_schema(
        tags=["Medical Claims"],
        operation_description="Create a new medical claim with initial claim items. Receptionist endpoint.",
        responses={
            201: MedicalClaimDetailSerializer,
            400: ErrorResponseSerializer,
        },
    )
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {"detail": serializer.errors, "error_code": "VALIDATION_ERROR"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        medical_claim = serializer.save(submitted_by=request.user.receptionist)
        MedicalClaimEvent.objects.create(
            medical_claim=medical_claim,
            status=medical_claim.claim_status,
            notes="Medical claim created with initial items.",
            changed_by=request.user,
        )
        invalidate_group(CLAIMS_CACHE_GROUP)
        return Response(
            MedicalClaimDetailSerializer(medical_claim).data,
            status=status.HTTP_201_CREATED,
        )


class MedicalClaimDetailView(RetrieveUpdateAPIView):
    """View and add items to a medical claim."""

    permission_classes = [IsSystemOrHospitalAdminOrReceptionist]
    queryset = MedicalClaim.objects.select_related(
        "hospital", 
        "voucher", 
        "submitted_by__user", 
        "reviewed_by__user"
    ).prefetch_related("claim_items", "proofs")
    lookup_field = "pk"

    def get_serializer_class(self):
        if self.request.method == "PUT" or self.request.method == "PATCH":
            return MedicalClaimAddItemsSerializer
        return MedicalClaimDetailSerializer

    @swagger_auto_schema(
        tags=["Medical Claims"],
        operation_description="Retrieve a medical claim with all items and proofs.",
        responses={200: MedicalClaimDetailSerializer, 404: ErrorResponseSerializer},
    )
    @cache_response(group=CLAIMS_CACHE_GROUP, timeout=CLAIMS_CACHE_TIMEOUT)
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    @swagger_auto_schema(
        tags=["Medical Claims"],
        operation_description="Add more items to an existing medical claim. Total cost is automatically updated.",
        request_body=MedicalClaimAddItemsSerializer,
        responses={
            200: MedicalClaimDetailSerializer,
            400: ErrorResponseSerializer,
            404: ErrorResponseSerializer,
        },
    )
    def put(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data)
        if not serializer.is_valid():
            return Response(
                {"detail": serializer.errors, "error_code": "VALIDATION_ERROR"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        medical_claim = serializer.save()
        invalidate_group(CLAIMS_CACHE_GROUP)
        return Response(
            MedicalClaimDetailSerializer(medical_claim).data,
            status=status.HTTP_200_OK,
        )

    @swagger_auto_schema(
        tags=["Medical Claims"],
        operation_description="Partially add items to a medical claim.",
        request_body=MedicalClaimAddItemsSerializer,
        responses={
            200: MedicalClaimDetailSerializer,
            400: ErrorResponseSerializer,
            404: ErrorResponseSerializer,
        },
    )
    def patch(self, request, *args, **kwargs):
        kwargs["partial"] = True
        return self.put(request, *args, **kwargs)


class MedicalClaimListView(ListAPIView):
    """List all medical claims with filtering."""

    permission_classes = [IsSystemOrHospitalAdminOrReceptionist]
    queryset = MedicalClaim.objects.select_related("hospital").all()
    serializer_class = MedicalClaimListSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_class = MedicalClaimFilter

    @swagger_auto_schema(
        tags=["Medical Claims"],
        operation_description="List all medical claims with optional filters (claim_status, hospital, total_cost range, submitted_at range, service_completed).",
    )
    @cache_response(group=CLAIMS_CACHE_GROUP, timeout=CLAIMS_CACHE_TIMEOUT)
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)


class MedicalClaimProofListCreateView(ListCreateAPIView):
    """List and upload proof documents for a medical claim."""

    permission_classes = [IsReceptionist]
    serializer_class = MedicalClaimProofSerializer

    def get_queryset(self):
        medical_claim_id = self.kwargs.get("medical_claim_id")
        return MedicalClaimProof.objects.filter(medical_claim_id=medical_claim_id)

    def get_serializer_class(self):
        if self.request.method == "POST":
            return MedicalClaimProofCreateSerializer
        return MedicalClaimProofSerializer

    @swagger_auto_schema(
        tags=["Medical Claims - Proofs"],
        operation_description="List all proof documents for a medical claim.",
        responses={200: MedicalClaimProofSerializer(many=True)},
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    @swagger_auto_schema(
        tags=["Medical Claims - Proofs"],
        operation_description="Upload a proof document (bill, prescription, lab result, etc.) for a medical claim.",
        request_body=MedicalClaimProofCreateSerializer,
        responses={
            201: MedicalClaimProofSerializer,
            400: ErrorResponseSerializer,
            404: ErrorResponseSerializer,
        },
    )
    def post(self, request, *args, **kwargs):
        medical_claim_id = self.kwargs.get("medical_claim_id")
        try:
            medical_claim = MedicalClaim.objects.get(id=medical_claim_id)
        except MedicalClaim.DoesNotExist:
            return Response(
                {"detail": "Medical claim not found.", "error_code": "CLAIM_NOT_FOUND"},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {"detail": serializer.errors, "error_code": "VALIDATION_ERROR"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        proof = serializer.save(
            medical_claim=medical_claim, uploaded_by=request.user.receptionist
        )
        MedicalClaimProofEvent.objects.create(
            medical_claim_proof=proof,
            status=proof.verification_status,
            notes="Proof document uploaded.",
            changed_by=request.user,
        )
        return Response(
            MedicalClaimProofSerializer(proof).data,
            status=status.HTTP_201_CREATED,
        )


class MedicalClaimProofDetailView(RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete a proof document."""

    permission_classes = [IsReceptionist]
    queryset = MedicalClaimProof.objects.all()
    serializer_class = MedicalClaimProofSerializer
    lookup_field = "pk"

    def get_queryset(self):
        medical_claim_id = self.kwargs.get("medical_claim_id")
        return MedicalClaimProof.objects.filter(medical_claim_id=medical_claim_id)

    def get_serializer_class(self):
        if self.request.method in ["PUT", "PATCH"]:
            return MedicalClaimProofCreateSerializer
        return MedicalClaimProofSerializer

    @swagger_auto_schema(
        tags=["Medical Claims - Proofs"],
        operation_description="Retrieve details of a proof document.",
        responses={200: MedicalClaimProofSerializer, 404: ErrorResponseSerializer},
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    @swagger_auto_schema(
        tags=["Medical Claims - Proofs"],
        operation_description="Update a proof document (e.g., re-upload if rejected).",
        request_body=MedicalClaimProofCreateSerializer,
        responses={
            200: MedicalClaimProofSerializer,
            400: ErrorResponseSerializer,
            404: ErrorResponseSerializer,
        },
    )
    def patch(self, request, *args, **kwargs):
        return super().patch(request, *args, **kwargs)

    @swagger_auto_schema(
        tags=["Medical Claims - Proofs"],
        operation_description="Replace a proof document entirely.",
        request_body=MedicalClaimProofCreateSerializer,
        responses={
            200: MedicalClaimProofSerializer,
            400: ErrorResponseSerializer,
            404: ErrorResponseSerializer,
        },
    )
    def put(self, request, *args, **kwargs):
        return super().put(request, *args, **kwargs)

    @swagger_auto_schema(
        tags=["Medical Claims - Proofs"],
        operation_description="Delete a proof document.",
        responses={204: "Document deleted successfully", 404: ErrorResponseSerializer},
    )
    def delete(self, request, *args, **kwargs):
        return super().delete(request, *args, **kwargs)


class MedicalClaimProofVerifyView(APIView):
    """Verify a proof document (System Admin only)."""

    permission_classes = [IsSystemAdmin]

    @swagger_auto_schema(
        tags=["Medical Claims - Proofs"],
        operation_description="Verify and approve a proof document. System Admin endpoint.",
        responses={
            200: MedicalClaimProofSerializer,
            404: ErrorResponseSerializer,
            400: ErrorResponseSerializer,
        },
    )
    def post(self, request, medical_claim_id, pk):
        try:
            proof = MedicalClaimProof.objects.get(
                id=pk, medical_claim_id=medical_claim_id
            )
        except MedicalClaimProof.DoesNotExist:
            return Response(
                {"detail": "Proof document not found.", "error_code": "PROOF_NOT_FOUND"},
                status=status.HTTP_404_NOT_FOUND,
            )

        proof.verification_status = "VERIFIED"
        proof.verified_by = request.user.systemadmin
        proof.verified_at = timezone.now()
        proof.rejection_reason = None
        proof.save()

        MedicalClaimProofEvent.objects.create(
            medical_claim_proof=proof,
            status=proof.verification_status,
            notes="Proof document verified and approved.",
            changed_by=request.user,
        )

        return Response(
            MedicalClaimProofSerializer(proof).data,
            status=status.HTTP_200_OK,
        )


class MedicalClaimProofRejectView(APIView):
    """Reject a proof document with a reason (System Admin only)."""

    permission_classes = [IsSystemAdmin]

    @swagger_auto_schema(
        tags=["Medical Claims - Proofs"],
        operation_description="Reject a proof document with a reason. System Admin endpoint.",
        request_body=MedicalClaimProofRejectSerializer,
        responses={
            200: MedicalClaimProofSerializer,
            404: ErrorResponseSerializer,
            400: ErrorResponseSerializer,
        },
    )
    def post(self, request, medical_claim_id, pk):
        try:
            proof = MedicalClaimProof.objects.get(
                id=pk, medical_claim_id=medical_claim_id
            )
        except MedicalClaimProof.DoesNotExist:
            return Response(
                {"detail": "Proof document not found.", "error_code": "PROOF_NOT_FOUND"},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = MedicalClaimProofRejectSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {"detail": serializer.errors, "error_code": "VALIDATION_ERROR"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        proof.verification_status = "REJECTED"
        proof.verified_by = request.user.systemadmin
        proof.verified_at = timezone.now()
        proof.rejection_reason = serializer.validated_data.get("rejection_reason")
        proof.save()

        MedicalClaimProofEvent.objects.create(
                medical_claim_proof=proof,
                status=proof.verification_status,
                notes=f"Proof document rejected. Reason: {proof.rejection_reason}",
                changed_by=request.user,
            )

        return Response(
            MedicalClaimProofSerializer(proof).data,
            status=status.HTTP_200_OK,
        )


class MedicalClaimProofFlagView(APIView):
    """Flag a proof document for review with a reason (System Admin only)."""

    permission_classes = [IsSystemAdmin]

    @swagger_auto_schema(
        tags=["Medical Claims - Proofs"],
        operation_description="Flag a proof document for manual review with a reason. System Admin endpoint.",
        request_body=MedicalClaimProofFlagSerializer,
        responses={
            200: MedicalClaimProofSerializer,
            404: ErrorResponseSerializer,
            400: ErrorResponseSerializer,
        },
    )
    def post(self, request, medical_claim_id, pk):
        try:
            proof = MedicalClaimProof.objects.get(
                id=pk, medical_claim_id=medical_claim_id
            )
        except MedicalClaimProof.DoesNotExist:
            return Response(
                {"detail": "Proof document not found.", "error_code": "PROOF_NOT_FOUND"},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = MedicalClaimProofFlagSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {"detail": serializer.errors, "error_code": "VALIDATION_ERROR"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        proof.verification_status = "FLAGGED"
        proof.verified_by = request.user.systemadmin
        proof.verified_at = timezone.now()
        proof.rejection_reason = serializer.validated_data.get("rejection_reason")
        proof.save()

        MedicalClaimProofEvent.objects.create(
                medical_claim_proof=proof,
                status=proof.verification_status,
                notes=f"Proof document flagged for review. Reason: {proof.rejection_reason}",
                changed_by=request.user,
            )

        return Response(
            MedicalClaimProofSerializer(proof).data,
            status=status.HTTP_200_OK,
        )





class MedicalClaimMarkCompleteView(APIView):
    """Receptionist marks that all medical services have been completed."""

    permission_classes = [IsReceptionist]

    @swagger_auto_schema(
        tags=["Medical Claims"],
        operation_description="Mark medical services as complete and ready for final admin verification. No request body needed.",
        responses={
            200: MedicalClaimDetailSerializer,
            400: ErrorResponseSerializer,
            404: ErrorResponseSerializer,
        },
    )
    def post(self, request, medical_claim_id):
        try:
            medical_claim = MedicalClaim.objects.get(id=medical_claim_id)
        except MedicalClaim.DoesNotExist:
            return Response(
                {"detail": "Medical claim not found.", "error_code": "CLAIM_NOT_FOUND"},
                status=status.HTTP_404_NOT_FOUND,
            )

        success, message = mark_claim_service_complete(
            medical_claim=medical_claim,
            receptionist=request.user.receptionist,
        )

        if not success:
            return Response(
                {"detail": message, "error_code": "MARK_COMPLETE_FAILED"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        invalidate_group(CLAIMS_CACHE_GROUP)
        return Response(
            MedicalClaimDetailSerializer(medical_claim).data,
            status=status.HTTP_200_OK,
        )


class MedicalClaimApproveView(APIView):
    """System Admin approves a medical claim."""

    permission_classes = [IsSystemAdmin]

    @swagger_auto_schema(
        tags=["Medical Claims"],
        operation_description="Admin approves a medical claim. Optional approval_notes for audit trail.",
        request_body=MedicalClaimApproveSerializer,
        responses={
            200: MedicalClaimDetailSerializer,
            400: ErrorResponseSerializer,
            404: ErrorResponseSerializer,
        },
    )
    def post(self, request, medical_claim_id):
        old_status = ""
        try:
            medical_claim = MedicalClaim.objects.get(id=medical_claim_id)
            old_status = medical_claim.claim_status
        except MedicalClaim.DoesNotExist:
            return Response(
                {"detail": "Medical claim not found.", "error_code": "CLAIM_NOT_FOUND"},
                status=status.HTTP_404_NOT_FOUND,
            )

        if medical_claim.claim_status != "PENDING":
            return Response(
                {
                    "detail": f"Cannot approve claim with status {medical_claim.claim_status}. Only PENDING claims can be approved.",
                    "error_code": "INVALID_STATUS",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = MedicalClaimApproveSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {"detail": serializer.errors, "error_code": "VALIDATION_ERROR"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        medical_claim.claim_status = "APPROVED"
        medical_claim.reviewed_by = request.user
        medical_claim.reviewed_at = timezone.now()
        medical_claim.rejection_reason = None
        medical_claim.save(
            update_fields=[
                "claim_status",
                "reviewed_by",
                "reviewed_at",
                "rejection_reason",
            ]
        )

        MedicalClaimEvent.objects.create(
            medical_claim=medical_claim,
            status=medical_claim.claim_status,
            notes=f"MedicalClaim status changed from {old_status} to {medical_claim.claim_status}",
            changed_by=request.user,
        )

        invalidate_group(CLAIMS_CACHE_GROUP)
        return Response(
            MedicalClaimDetailSerializer(medical_claim).data,
            status=status.HTTP_200_OK,
        )


class MedicalClaimRejectView(APIView):
    """System Admin rejects a medical claim with a reason."""

    permission_classes = [IsSystemAdmin]

    @swagger_auto_schema(
        tags=["Medical Claims"],
        operation_description="Admin rejects a medical claim with a reason.",
        request_body=MedicalClaimRejectSerializer,
        responses={
            200: MedicalClaimDetailSerializer,
            400: ErrorResponseSerializer,
            404: ErrorResponseSerializer,
        },
    )
    def post(self, request, medical_claim_id):
        try:
            medical_claim = MedicalClaim.objects.get(id=medical_claim_id)
        except MedicalClaim.DoesNotExist:
            return Response(
                {"detail": "Medical claim not found.", "error_code": "CLAIM_NOT_FOUND"},
                status=status.HTTP_404_NOT_FOUND,
            )

        if medical_claim.claim_status != "PENDING":
            return Response(
                {
                    "detail": f"Cannot reject claim with status {medical_claim.claim_status}. Only PENDING claims can be rejected.",
                    "error_code": "INVALID_STATUS",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = MedicalClaimRejectSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {"detail": serializer.errors, "error_code": "VALIDATION_ERROR"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        medical_claim.claim_status = "REJECTED"
        medical_claim.reviewed_by = request.user
        medical_claim.reviewed_at = timezone.now()
        medical_claim.rejection_reason = serializer.validated_data.get("rejection_reason")
        medical_claim.save(
            update_fields=[
                "claim_status",
                "reviewed_by",
                "reviewed_at",
                "rejection_reason",
            ]
        )
        MedicalClaimEvent.objects.create(
            medical_claim=medical_claim,
            status=medical_claim.claim_status,
            notes=f"MedicalClaim status changed from PENDING to REJECTED. Reason: {medical_claim.rejection_reason}",
            changed_by=request.user,
        )
        invalidate_group(CLAIMS_CACHE_GROUP)
        return Response(
            MedicalClaimDetailSerializer(medical_claim).data,
            status=status.HTTP_200_OK,
        )


class MedicalClaimFinalVerifyView(APIView):
    """System Admin verifies completed claim and triggers fund disbursement."""

    permission_classes = [IsSystemAdmin]

    @swagger_auto_schema(
        tags=["Medical Claims"],
        operation_description="""
Final verification and approval - triggers fund disbursement to hospital.
Optional approval_notes for audit trail.

**Possible Error Codes:**
- `CLAIM_NOT_FOUND`: The specified medical claim ID does not exist.
- `SERVICE_NOT_COMPLETE`: The medical service hasn't been marked as completed yet.
- `CLAIM_STATUS_NOT_APPROVED`: Only claims with 'APPROVED' status can be finalized.
- `VOUCHER_STATUS_NOT_USED`: The associated voucher must be in 'USED' status (PIN confirmed).
- `FUNDING_EXCEEDS_COST`: The committed funds exceed the actual claim cost.
- `DISBURSEMENT_FAILED`: An error occurred during the fund disbursement process.
- `VALIDATION_ERROR`: The request body failed validation.
        """,
        request_body=MedicalClaimFinalVerifySerializer,
        responses={
            200: MedicalClaimDetailSerializer,
            400: ErrorResponseSerializer,
            404: ErrorResponseSerializer,
        },
    )
    def post(self, request, medical_claim_id):
        from django.db.models import Sum
        from decimal import Decimal
        from vouchers.models import Voucher

        try:
            medical_claim = MedicalClaim.objects.get(id=medical_claim_id)
        except MedicalClaim.DoesNotExist:
            return Response(
                {"detail": "Medical claim not found.", "error_code": "CLAIM_NOT_FOUND"},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Validate: service must be marked complete
        if medical_claim.service_completed_at is None:
            return Response(
                {
                    "detail": "Service must be marked complete before final verification.",
                    "error_code": "SERVICE_NOT_COMPLETE",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validate: claim must be APPROVED
        if medical_claim.claim_status != "APPROVED":
            return Response(
                {
                    "detail": f"Claim status must be APPROVED before final verification. Current status: {medical_claim.claim_status}",
                    "error_code": "CLAIM_STATUS_NOT_APPROVED",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validate: voucher must be USED (PIN confirmed)
        voucher = medical_claim.voucher
        if voucher.status != Voucher.Status.USED:
            return Response(
                {
                    "detail": f"Voucher must be USED (PIN confirmed) before final verification. Current status: {voucher.status}",
                    "error_code": "VOUCHER_STATUS_NOT_USED",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validate: total funded amount <= medical claim cost
        total_funded = voucher.funding_records.filter(status="COMMITTED").aggregate(
            total=Sum("committed_amount")
        )["total"] or Decimal("0.00")

        if total_funded > medical_claim.total_cost:
            return Response(
                {
                    "detail": f"Voucher funding ({total_funded:.2f} XAF) exceeds medical claim cost ({medical_claim.total_cost:.2f} XAF).",
                    "error_code": "FUNDING_EXCEEDS_COST",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validate request body with optional approval_notes
        serializer = MedicalClaimFinalVerifySerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {"detail": serializer.errors, "error_code": "VALIDATION_ERROR"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Settle voucher and disburse funds
        success, message = settle_voucher_with_campaign_updates(voucher)

        if not success:
            return Response(
                {
                    "detail": f"Disbursement failed: {message}",
                    "error_code": "DISBURSEMENT_FAILED",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Send notifications to campaign creators (async)
        send_campaign_contributor_notifications(str(voucher.id))

        invalidate_group(CLAIMS_CACHE_GROUP)
        return Response(
            MedicalClaimDetailSerializer(medical_claim).data,
            status=status.HTTP_200_OK,
        )





class VoucherApproveView(APIView):
    """System Admin approves a voucher, transitioning to PENDING_CONFIRMATION."""

    permission_classes = [IsSystemAdmin]

    @swagger_auto_schema(
        tags=["Vouchers"],
        operation_description="Admin approves a voucher, transitioning it from ACTIVE to PENDING_CONFIRMATION.",
        request_body=VoucherApproveSerializer,
        responses={
            200: "Voucher approved successfully",
            400: ErrorResponseSerializer,
            404: ErrorResponseSerializer,
        },
    )
    def post(self, request, voucher_id):
        try:
            from vouchers.models import Voucher

            voucher = Voucher.objects.get(id=voucher_id)
        except Voucher.DoesNotExist:
            return Response(
                {"detail": "Voucher not found.", "error_code": "VOUCHER_NOT_FOUND"},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = VoucherApproveSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {"detail": serializer.errors, "error_code": "VALIDATION_ERROR"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        success, message = approve_voucher(
            voucher=voucher,
            system_admin=request.user,
        )

        if not success:
            return Response(
                {"detail": message, "error_code": "APPROVAL_FAILED"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        invalidate_group(CLAIMS_CACHE_GROUP)
        invalidate_group('vouchers')
        return Response(
            {"detail": message},
            status=status.HTTP_200_OK,
        )


class VoucherConfirmPinView(APIView):
    """Receptionist confirms beneficiary's PIN to complete voucher redemption."""

    permission_classes = [IsReceptionist]

    @swagger_auto_schema(
        tags=["Vouchers"],
        operation_description="Receptionist confirms PIN provided by beneficiary. Transitions voucher from PENDING_CONFIRMATION to USED.",
        request_body=VoucherConfirmPinSerializer,
        responses={
            200: "PIN confirmed successfully",
            400: ErrorResponseSerializer,
            404: ErrorResponseSerializer,
        },
    )
    def post(self, request, voucher_id):
        try:
            from vouchers.models import Voucher

            voucher = Voucher.objects.get(id=voucher_id)
        except Voucher.DoesNotExist:
            return Response(
                {"detail": "Voucher not found.", "error_code": "VOUCHER_NOT_FOUND"},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = VoucherConfirmPinSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {"detail": serializer.errors, "error_code": "VALIDATION_ERROR"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        success, message = confirm_voucher_pin(
            voucher=voucher,
            provided_pin=serializer.validated_data.get("patient_pin"),
            receptionist=request.user,
        )

        if not success:
            return Response(
                {"detail": message, "error_code": "PIN_CONFIRMATION_FAILED"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        invalidate_group(CLAIMS_CACHE_GROUP)
        invalidate_group('vouchers')
        return Response(
            {"detail": message},
            status=status.HTTP_200_OK,
        )
