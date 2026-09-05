from drf_yasg.utils import swagger_auto_schema
from rest_framework import status
from rest_framework.generics import (
    ListCreateAPIView,
    RetrieveUpdateDestroyAPIView,
)
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from beneficiaries.models import Beneficiary
from beneficiaries.models.document import BeneficiaryDocument
from beneficiaries.serializers import BeneficiaryDocumentSerializer
from .beneficiary import IsSocialWorker, IsSystemAdmin, CanViewBeneficiaries
from core.cache import cache_response, invalidate_group

_TAG = ["Beneficiaries"]


class BeneficiaryDocumentListCreateView(ListCreateAPIView):
    """
    List and upload documents for a specific beneficiary.
    GET  /api/beneficiaries/{id}/documents/ — list all documents
    POST /api/beneficiaries/{id}/documents/ — upload one or multiple documents
    """
    serializer_class = BeneficiaryDocumentSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsAuthenticated(), IsSocialWorker()]
        return [IsAuthenticated(), CanViewBeneficiaries()]

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return BeneficiaryDocument.objects.none()
        beneficiary_id = self.kwargs["beneficiary_id"]
        return BeneficiaryDocument.objects.filter(beneficiary_id=beneficiary_id).order_by("-uploaded_at")

    @cache_response(group="beneficiary_documents", timeout=60)
    @swagger_auto_schema(
        tags=_TAG,
        operation_description="List all documents for a specific beneficiary.",
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    @swagger_auto_schema(
        tags=_TAG,
        request_body=BeneficiaryDocumentSerializer,
        responses={201: BeneficiaryDocumentSerializer(many=True)},
        operation_description="Upload one or multiple documents for a beneficiary. Send 'documents' as a list of files.",
    )
    def post(self, request, *args, **kwargs):
        beneficiary_id = self.kwargs["beneficiary_id"]
        try:
            beneficiary = Beneficiary.objects.get(id=beneficiary_id)
        except Beneficiary.DoesNotExist:
            return Response(
                {"detail": "Beneficiary not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        documents = serializer.save(beneficiary=beneficiary)

        invalidate_group("beneficiary_documents")
        output = BeneficiaryDocumentSerializer(documents, many=True).data
        return Response(output, status=status.HTTP_201_CREATED)


class BeneficiaryDocumentDetailView(RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update, or delete a specific document for a beneficiary.
    GET    /api/beneficiaries/{id}/documents/{doc_id}/
    PATCH  /api/beneficiaries/{id}/documents/{doc_id}/
    DELETE /api/beneficiaries/{id}/documents/{doc_id}/
    """
    serializer_class = BeneficiaryDocumentSerializer
    lookup_field = "id"
    lookup_url_kwarg = "doc_id"

    def get_permissions(self):
        if self.request.method in ["PUT", "PATCH", "DELETE"]:
            return [IsAuthenticated(), IsSystemAdmin()]
        return [IsAuthenticated(), CanViewBeneficiaries()]

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return BeneficiaryDocument.objects.none()
        beneficiary_id = self.kwargs["beneficiary_id"]
        return BeneficiaryDocument.objects.filter(beneficiary_id=beneficiary_id)

    @cache_response(group="beneficiary_documents", timeout=60)
    @swagger_auto_schema(
        tags=_TAG,
        responses={200: BeneficiaryDocumentSerializer},
        operation_description="Retrieve a specific document for a beneficiary.",
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    @swagger_auto_schema(
        tags=_TAG,
        request_body=BeneficiaryDocumentSerializer,
        responses={200: BeneficiaryDocumentSerializer},
        operation_description="Partially update document info (System Admin only).",
    )
    def patch(self, request, *args, **kwargs):
        kwargs["partial"] = True
        response = super().patch(request, *args, **kwargs)
        invalidate_group("beneficiary_documents")
        return response

    @swagger_auto_schema(
        tags=_TAG,
        request_body=BeneficiaryDocumentSerializer,
        responses={200: BeneficiaryDocumentSerializer},
        operation_description="Replace document info entirely (System Admin only).",
    )
    def put(self, request, *args, **kwargs):
        response = super().put(request, *args, **kwargs)
        invalidate_group("beneficiary_documents")
        return response

    @swagger_auto_schema(
        tags=_TAG,
        responses={204: "No Content"},
        operation_description="Delete a beneficiary document (System Admin only).",
    )
    def delete(self, request, *args, **kwargs):
        response = super().delete(request, *args, **kwargs)
        invalidate_group("beneficiary_documents")
        return response
