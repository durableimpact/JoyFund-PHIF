from django.db.models import Sum, Count
from django.core.cache import cache
from django_filters.rest_framework import DjangoFilterBackend
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import BasePermission, IsAuthenticated
from rest_framework.response import Response

from accounts.models import Role
from accounts.serializers import ReceptionistDetailSerializer
from accounts.utils import cache_response, invalidate_cache
from hospitals.models import Hospital
from hospitals.serializers import (
    HospitalCreateUpdateSerializer,
    HospitalDetailSerializer,
    HospitalListSerializer,
)
from logs.services import LogService
from vouchers.models import Voucher

_TAG = ["Hospitals"]
CACHE_TIMEOUT = 60 * 5  # 5 minutes


class IsSystemOrHospitalAdmin(BasePermission):
    message = "Only System Admins or Hospital Admins can perform this action."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role in {Role.SYSTEM_ADMIN, Role.HOSPITAL_ADMIN}
        )


class HospitalViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing hospitals.
    - System Admin: full CRUD
    - Hospital Admin: retrieve, update, partial_update (own hospital)
    """
    permission_classes = [IsAuthenticated, IsSystemOrHospitalAdmin]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = {
        "id": ["exact"],
        "name": ["exact", "icontains"],
        "region": ["exact", "icontains"],
        "city": ["exact", "icontains"],
        "partnership_status": ["exact"],
        "is_active": ["exact"],
        "created_at": ["date", "gte", "lte"],
        "updated_at": ["date", "gte", "lte"],
        "admins__id": ["exact", "isnull"],
        "admins__user__email": ["exact", "icontains"],
    }
    search_fields = [
        "name",
        "address",
        "email",
        "phone_number",
        "accreditation_number",
        "licence_number",
    ]
    ordering_fields = ["created_at", "updated_at", "name", "city", "region"]

    def get_queryset(self):
        return (
            Hospital.objects.prefetch_related("admins__user")
            .all()
            .order_by("-created_at")
        )

    def get_serializer_class(self):
        if self.action in ["create", "update", "partial_update"]:
            return HospitalCreateUpdateSerializer
        elif self.action == "list":
            return HospitalListSerializer
        return HospitalDetailSerializer

    @swagger_auto_schema(
        tags=_TAG,
        responses={200: HospitalListSerializer(many=True)},
        operation_description="List hospitals.",
    )
    @cache_response(timeout=CACHE_TIMEOUT)
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @swagger_auto_schema(
        tags=_TAG,
        request_body=HospitalCreateUpdateSerializer,
        responses={201: HospitalDetailSerializer},
        operation_description="Create a hospital.",
    )
    @invalidate_cache("view_cache:*")
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        instance = serializer.save()
        
        # Return full detail representation with id
        detail_serializer = HospitalDetailSerializer(instance)
        return Response(detail_serializer.data, status=status.HTTP_201_CREATED)

    @swagger_auto_schema(
        tags=_TAG,
        responses={200: HospitalDetailSerializer},
        operation_description="Retrieve a hospital.",
    )
    @cache_response(timeout=CACHE_TIMEOUT)
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

    @swagger_auto_schema(
        tags=_TAG,
        request_body=HospitalCreateUpdateSerializer,
        responses={200: HospitalDetailSerializer},
        operation_description="Replace a hospital.",
    )
    @invalidate_cache("view_cache:*")
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)

    @swagger_auto_schema(
        tags=_TAG,
        request_body=HospitalCreateUpdateSerializer,
        responses={200: HospitalDetailSerializer},
        operation_description="Update a hospital.",
    )
    @invalidate_cache("view_cache:*")
    def partial_update(self, request, *args, **kwargs):
        return super().partial_update(request, *args, **kwargs)

    @swagger_auto_schema(
        tags=_TAG,
        responses={204: "No Content"},
        operation_description="Delete a hospital.",
    )
    @invalidate_cache("view_cache:*")
    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)

    @action(
        detail=True,
        methods=["get"],
        permission_classes=[IsAuthenticated, IsSystemOrHospitalAdmin],
        url_path="redeemed-vouchers-total",
    )
    @swagger_auto_schema(
        tags=_TAG,
        responses={
            200: openapi.Response(
                description="Total redeemed vouchers statistics for the hospital",
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        "hospital_id": openapi.Schema(type=openapi.TYPE_STRING),
                        "hospital_name": openapi.Schema(type=openapi.TYPE_STRING),
                        "total_redeemed_vouchers": openapi.Schema(
                            type=openapi.TYPE_INTEGER
                        ),
                        "total_redeemed_amount": openapi.Schema(
                            type=openapi.TYPE_NUMBER
                        ),
                        "currency": openapi.Schema(type=openapi.TYPE_STRING),
                    },
                ),
            )
        },
        operation_description="Get total count and amount of redeemed vouchers for a specific hospital.",
    )
    def redeemed_vouchers_total(self, request, pk=None):
        """Get total redeemed vouchers statistics for a hospital"""
        try:
            hospital = self.get_object()
        except Hospital.DoesNotExist:
            return Response(
                {"detail": "Hospital not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Query redeemed vouchers for this hospital
        redeemed_stats = Voucher.objects.filter(
            hospital=hospital, status=Voucher.Status.USED
        ).aggregate(total_count=Count("id"), total_amount=Sum("value"))

        # Log this action
        LogService.info(
            request,
            "hospital.view_redeemed_vouchers_total",
            user=request.user,
            description=f"Viewed redeemed vouchers total for hospital: {hospital.name}",
            target=hospital,
            metadata={
                "hospital_id": str(hospital.id),
                "total_redeemed": redeemed_stats["total_count"] or 0,
                "total_amount": float(redeemed_stats["total_amount"] or 0),
            },
        )

        return Response(
            {
                "hospital_id": str(hospital.id),
                "hospital_name": hospital.name,
                "total_redeemed_vouchers": redeemed_stats["total_count"] or 0,
                "total_redeemed_amount": float(redeemed_stats["total_amount"] or 0),
                "currency": "XAF",
            },
            status=status.HTTP_200_OK,
        )

    @action(
        detail=True,
        methods=["get"],
        permission_classes=[IsAuthenticated, IsSystemOrHospitalAdmin],
        url_path="receptionists",
    )
    @swagger_auto_schema(
        tags=_TAG,
        responses={200: ReceptionistDetailSerializer(many=True)},
        operation_description="Get all receptionists for a specific hospital.",
    )
    def receptionists(self, request, pk=None):
        """Get all receptionists for a hospital"""
        try:
            hospital = self.get_object()
        except Hospital.DoesNotExist:
            return Response(
                {"detail": "Hospital not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Get all receptionists for this hospital
        receptionists = (
            hospital.receptionists.select_related("user", "enrolled_by__user")
            .all()
            .order_by("-user__created_at")
        )

        # Apply pagination
        page = self.paginate_queryset(receptionists)
        if page is not None:
            serializer = ReceptionistDetailSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = ReceptionistDetailSerializer(receptionists, many=True)
        return Response(serializer.data)
