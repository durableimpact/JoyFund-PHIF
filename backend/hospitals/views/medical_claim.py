from rest_framework.generics import (
    CreateAPIView,
    RetrieveUpdateAPIView,
    ListCreateAPIView,
    RetrieveUpdateDestroyAPIView,
)
from rest_framework.permissions import IsAuthenticated, BasePermission
from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView
from drf_yasg.utils import swagger_auto_schema
from django.utils import timezone

from hospitals.models import MedicalClaim, MedicalClaimProof
from hospitals.serializers.medical_claim import (
    MedicalClaimCreateSerializer,
    MedicalClaimDetailSerializer,
    MedicalClaimAddItemsSerializer,
    MedicalClaimProofSerializer,
    MedicalClaimProofCreateSerializer,
    MedicalClaimProofVerifySerializer,
    MedicalClaimProofRejectSerializer,
    MedicalClaimProofFlagSerializer,
)
from accounts.models import Role


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


class MedicalClaimCreateView(CreateAPIView):
    """Create a medical claim with initial claim items."""

    permission_classes = [IsReceptionist]
    serializer_class = MedicalClaimCreateSerializer

    @swagger_auto_schema(
        tags=["Medical Claims"],
        operation_description="Create a new medical claim with initial claim items. Receptionist endpoint.",
        responses={
            201: MedicalClaimDetailSerializer,
            400: "Validation error (missing items, invalid voucher, etc)",
        },
    )
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        medical_claim = serializer.save(submitted_by=request.user.receptionist)
        return Response(
            MedicalClaimDetailSerializer(medical_claim).data,
            status=status.HTTP_201_CREATED,
        )


class MedicalClaimDetailView(RetrieveUpdateAPIView):
    """View and add items to a medical claim."""

    permission_classes = [IsReceptionist]
    queryset = MedicalClaim.objects.prefetch_related("claim_items", "proofs")
    lookup_field = "pk"

    def get_serializer_class(self):
        if self.request.method == "PUT" or self.request.method == "PATCH":
            return MedicalClaimAddItemsSerializer
        return MedicalClaimDetailSerializer

    @swagger_auto_schema(
        tags=["Medical Claims"],
        operation_description="Retrieve a medical claim with all items and proofs.",
        responses={200: MedicalClaimDetailSerializer},
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    @swagger_auto_schema(
        tags=["Medical Claims"],
        operation_description="Add more items to an existing medical claim. Total cost is automatically updated.",
        request_body=MedicalClaimAddItemsSerializer,
        responses={200: MedicalClaimDetailSerializer},
    )
    def put(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data)
        serializer.is_valid(raise_exception=True)
        medical_claim = serializer.save()
        return Response(
            MedicalClaimDetailSerializer(medical_claim).data,
            status=status.HTTP_200_OK,
        )

    @swagger_auto_schema(
        tags=["Medical Claims"],
        operation_description="Partially add items to a medical claim.",
        request_body=MedicalClaimAddItemsSerializer,
        responses={200: MedicalClaimDetailSerializer},
    )
    def patch(self, request, *args, **kwargs):
        kwargs["partial"] = True
        return self.put(request, *args, **kwargs)


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
            400: "Validation error (invalid document_type, missing file, etc)",
        },
    )
    def post(self, request, *args, **kwargs):
        medical_claim_id = self.kwargs.get("medical_claim_id")
        try:
            medical_claim = MedicalClaim.objects.get(id=medical_claim_id)
        except MedicalClaim.DoesNotExist:
            return Response(
                {"detail": "Medical claim not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        proof = serializer.save(
            medical_claim=medical_claim, uploaded_by=request.user.receptionist
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
        responses={200: MedicalClaimProofSerializer},
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    @swagger_auto_schema(
        tags=["Medical Claims - Proofs"],
        operation_description="Update a proof document (e.g., re-upload if rejected).",
        request_body=MedicalClaimProofCreateSerializer,
        responses={200: MedicalClaimProofSerializer},
    )
    def patch(self, request, *args, **kwargs):
        return super().patch(request, *args, **kwargs)

    @swagger_auto_schema(
        tags=["Medical Claims - Proofs"],
        operation_description="Replace a proof document entirely.",
        request_body=MedicalClaimProofCreateSerializer,
        responses={200: MedicalClaimProofSerializer},
    )
    def put(self, request, *args, **kwargs):
        return super().put(request, *args, **kwargs)

    @swagger_auto_schema(
        tags=["Medical Claims - Proofs"],
        operation_description="Delete a proof document.",
        responses={204: "Document deleted successfully"},
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
            404: "Proof not found",
            400: "Bad request",
        },
    )
    def post(self, request, medical_claim_id, pk):
        try:
            proof = MedicalClaimProof.objects.get(
                id=pk, medical_claim_id=medical_claim_id
            )
        except MedicalClaimProof.DoesNotExist:
            return Response(
                {"detail": "Proof document not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        proof.verification_status = "VERIFIED"
        proof.verified_by = request.user.system_admin
        proof.verified_at = timezone.now()
        proof.rejection_reason = None
        proof.save()

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
            404: "Proof not found",
            400: "Bad request",
        },
    )
    def post(self, request, medical_claim_id, pk):
        try:
            proof = MedicalClaimProof.objects.get(
                id=pk, medical_claim_id=medical_claim_id
            )
        except MedicalClaimProof.DoesNotExist:
            return Response(
                {"detail": "Proof document not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = MedicalClaimProofRejectSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        proof.verification_status = "REJECTED"
        proof.verified_by = request.user.system_admin
        proof.verified_at = timezone.now()
        proof.rejection_reason = serializer.validated_data["rejection_reason"]
        proof.save()

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
            404: "Proof not found",
            400: "Bad request",
        },
    )
    def post(self, request, medical_claim_id, pk):
        try:
            proof = MedicalClaimProof.objects.get(
                id=pk, medical_claim_id=medical_claim_id
            )
        except MedicalClaimProof.DoesNotExist:
            return Response(
                {"detail": "Proof document not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = MedicalClaimProofFlagSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        proof.verification_status = "FLAGGED"
        proof.verified_by = request.user.system_admin
        proof.verified_at = timezone.now()
        proof.rejection_reason = serializer.validated_data["rejection_reason"]
        proof.save()

        return Response(
            MedicalClaimProofSerializer(proof).data,
            status=status.HTTP_200_OK,
        )
