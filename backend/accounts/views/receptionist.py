from drf_yasg.utils import swagger_auto_schema
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework import status, viewsets, mixins
from rest_framework.decorators import action
from rest_framework.permissions import BasePermission, IsAuthenticated
from rest_framework.response import Response

from accounts.models import Receptionist, Role
from accounts.serializers import (
    ReceptionistCreateSerializer,
    ReceptionistDetailSerializer,
    ReceptionistUpdateSerializer,
    ReceptionistDashboardSerializer,
)
from accounts.utils import IsHospitalAdmin, IsOwnerOrHospitalAdmin
from core.cache import cache_response
from core.mixins import CacheInvalidationMixin
from accounts.filters import ReceptionistFilter
from hospitals.models import MedicalClaim, MedicalClaimProof
from vouchers.models.Voucher import Voucher

_TAG = ['Receptionists']


class IsHospitalAdminOrSystemAdmin(BasePermission):
    message = 'Only Hospital Admins or System Admins can perform this action.'

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role in {Role.HOSPITAL_ADMIN, Role.SYSTEM_ADMIN}
        )


class ReceptionistViewSet(
    CacheInvalidationMixin,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    mixins.CreateModelMixin,
    viewsets.GenericViewSet,
):
    """
    ViewSet for Receptionist management.
    """
    cache_group = "receptionists"
    extra_cache_prefixes = ["receptionist_info"]
    lookup_field = 'id'
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = ReceptionistFilter
    search_fields = ['user__email', 'user__first_name', 'user__last_name', 'national_id_number']
    ordering_fields = ['user__created_at']

    def get_queryset(self):
        # Handle schema generation for Swagger
        if getattr(self, 'swagger_fake_view', False):
            return Receptionist.objects.none()
        
        queryset = Receptionist.objects.select_related('user', 'enrolled_by__user', 'hospital').all().order_by('-user__created_at')
        if self.request.user.role == Role.SYSTEM_ADMIN:
            return queryset
        if self.request.user.role == Role.RECEPTIONIST:
            return queryset.filter(user=self.request.user)
        return queryset.filter(enrolled_by__user=self.request.user)

    def get_permissions(self):
        if self.action == 'create':
            return [IsAuthenticated(), IsHospitalAdmin()]
        elif self.action == 'list':
            return [IsAuthenticated(), IsHospitalAdminOrSystemAdmin()]
        elif self.action in ['retrieve', 'update', 'partial_update']:
            return [IsAuthenticated(), IsOwnerOrHospitalAdmin()]
        return [IsAuthenticated()]

    def get_serializer_class(self):
        if self.action == 'create':
            return ReceptionistCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return ReceptionistUpdateSerializer
        return ReceptionistDetailSerializer

    @swagger_auto_schema(
        tags=_TAG,
        request_body=ReceptionistCreateSerializer,
        responses={201: ReceptionistDetailSerializer},
        operation_description="Create a new Receptionist account. Only accessible by HOSPITAL_ADMIN.",
    )
    def create(self, request, *args, **kwargs):
        try:
            enrolled_by = request.user.hospitaladmin
        except Exception:
            return Response(
                {'detail': 'Requesting user does not have a HospitalAdmin profile.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = self.get_serializer(
            data=request.data,
            context={'enrolled_by': enrolled_by},
        )
        serializer.is_valid(raise_exception=True)
        receptionist = serializer.save()
        return Response(
            ReceptionistDetailSerializer(receptionist).data,
            status=status.HTTP_201_CREATED,
        )

    @swagger_auto_schema(
        tags=_TAG,
        responses={200: ReceptionistDetailSerializer(many=True)},
        operation_description='List Receptionist profiles with filtering and search support. SYSTEM_ADMIN sees all; HOSPITAL_ADMIN sees only their enrolled receptionists.',
    )
    @cache_response(group="receptionists", timeout=5 * 60)
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @swagger_auto_schema(
        tags=_TAG,
        responses={200: ReceptionistDetailSerializer},
        operation_description="Retrieve a Receptionist profile. Accessible by the receptionist, their hospital admin, or a SYSTEM_ADMIN.",
    )
    @cache_response(group="receptionists", timeout=10 * 60)
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

    @swagger_auto_schema(
        tags=_TAG,
        request_body=ReceptionistUpdateSerializer,
        responses={200: ReceptionistDetailSerializer},
        operation_description="Partially update a Receptionist profile. Accessible by the receptionist, their hospital admin, or a SYSTEM_ADMIN.",
    )
    def partial_update(self, request, *args, **kwargs):
        return super().partial_update(request, *args, **kwargs)

    @swagger_auto_schema(
        tags=_TAG,
        request_body=ReceptionistUpdateSerializer,
        responses={200: ReceptionistDetailSerializer},
        operation_description="Fully update a Receptionist profile. Accessible by the receptionist, their hospital admin, or a SYSTEM_ADMIN.",
    )
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)

    @action(
        detail=True,
        methods=["get"],
        permission_classes=[IsAuthenticated, IsOwnerOrHospitalAdmin],
        url_path="dashboard",
    )
    @swagger_auto_schema(
        tags=["Dashboard"],
        operation_description="Get dashboard statistics for a receptionist.",
        responses={200: ReceptionistDashboardSerializer()},
    )
    def dashboard(self, request, id=None):
        receptionist = self.get_object()

        redeemed_vouchers = Voucher.objects.filter(
            medical_claim__submitted_by=receptionist,
            status=Voucher.Status.USED,
        ).count()

        total_medical_claims = MedicalClaim.objects.filter(
            submitted_by=receptionist,
        ).count()

        pending_claims = MedicalClaim.objects.filter(
            submitted_by=receptionist,
            claim_status="PENDING",
        ).count()

        approved_claims = MedicalClaim.objects.filter(
            submitted_by=receptionist,
            claim_status="APPROVED",
        ).count()

        rejected_claims = MedicalClaim.objects.filter(
            submitted_by=receptionist,
            claim_status="REJECTED",
        ).count()

        uploaded_proofs = MedicalClaimProof.objects.filter(
            uploaded_by=receptionist,
        ).count()

        return Response({
            "redeemed_vouchers": redeemed_vouchers,
            "total_medical_claims": total_medical_claims,
            "pending_claims": pending_claims,
            "approved_claims": approved_claims,
            "rejected_claims": rejected_claims,
            "uploaded_proofs": uploaded_proofs,
        })

