from django.utils.decorators import method_decorator
from drf_yasg.utils import swagger_auto_schema
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework import status, viewsets, mixins
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.decorators import action

from accounts.models import HospitalAdmin
from accounts.serializers import (
    HospitalAdminCreateSerializer,
    HospitalAdminDetailSerializer,
    HospitalAdminUpdateSerializer,
    HospitalAdminDashboardSerializer,
)
from accounts.utils import IsOwnerOrSystemAdmin, IsSystemAdmin
from core.cache import cache_response
from core.mixins import CacheInvalidationMixin
from accounts.filters import HospitalAdminFilter
from vouchers.models.Voucher import Voucher
from hospitals.models import MedicalClaim

_TAG = ['Hospital Admins']


@method_decorator(name='list', decorator=swagger_auto_schema(tags=_TAG))
@method_decorator(name='retrieve', decorator=swagger_auto_schema(tags=_TAG))
@method_decorator(name='create', decorator=swagger_auto_schema(tags=_TAG))
@method_decorator(name='update', decorator=swagger_auto_schema(tags=_TAG))
@method_decorator(name='partial_update', decorator=swagger_auto_schema(tags=_TAG))

class HospitalAdminViewSet(
    CacheInvalidationMixin,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    mixins.CreateModelMixin,
    viewsets.GenericViewSet,
):
    """
    ViewSet for Hospital Admin management.
    
    Endpoints:
    - POST   /api/accounts/hospital-admins/          - Create hospital admin (SYSTEM_ADMIN only)
    - GET    /api/accounts/hospital-admins/          - List hospital admins (SYSTEM_ADMIN only)
    - GET    /api/accounts/hospital-admins/{id}/     - Get hospital admin details
    - PATCH  /api/accounts/hospital-admins/{id}/     - Update hospital admin (owner or SYSTEM_ADMIN)
    """
    cache_group = "hospital_admins"
    
    queryset = HospitalAdmin.objects.select_related('user', 'enrolled_by__user', 'hospital').all().order_by('-user__created_at')
    lookup_field = 'id'
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = HospitalAdminFilter
    search_fields = ['user__email', 'user__first_name', 'user__last_name', 'national_id_number']
    ordering_fields = ['user__created_at']

    def get_permissions(self):
        """Set permissions based on action."""
        if self.action in ['create', 'list']:
            return [IsAuthenticated(), IsSystemAdmin()]
        elif self.action in ['retrieve']:
            return [IsAuthenticated(), IsOwnerOrSystemAdmin()]
        elif self.action in ['update', 'partial_update']:
            return [IsAuthenticated(), IsOwnerOrSystemAdmin()]
        return [IsAuthenticated()]

    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action == 'create':
            return HospitalAdminCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return HospitalAdminUpdateSerializer
        return HospitalAdminDetailSerializer

    @swagger_auto_schema(
        tags=_TAG,
        responses={201: HospitalAdminDetailSerializer},
        operation_description="Create a new Hospital Admin account. Only SYSTEM_ADMIN can create. The `enrolled_by` field is automatically set to the requesting system admin.",
    )
    def create(self, request, *args, **kwargs):
        """Create a new hospital admin."""
        try:
            enrolled_by = request.user.systemadmin
        except Exception:
            return Response(
                {'detail': 'Requesting user does not have a SystemAdmin profile.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = self.get_serializer(
            data=request.data,
            context={'enrolled_by': enrolled_by},
        )
        serializer.is_valid(raise_exception=True)
        hospital_admin = serializer.save()
        return Response(
            HospitalAdminDetailSerializer(hospital_admin).data,
            status=status.HTTP_201_CREATED,
        )

    @swagger_auto_schema(
        tags=_TAG,
        responses={200: HospitalAdminDetailSerializer(many=True)},
        operation_description="List Hospital Admin profiles with filtering and search support. Only SYSTEM_ADMIN can list.",
    )
    @cache_response(group="hospital_admins", timeout=5 * 60)
    def list(self, request, *args, **kwargs):
        """List all hospital admins with caching."""
        return super().list(request, *args, **kwargs)

    @swagger_auto_schema(
        tags=_TAG,
        responses={200: HospitalAdminDetailSerializer},
        operation_description="Retrieve a Hospital Admin profile. Accessible by the hospital admin or a SYSTEM_ADMIN.",
    )
    @cache_response(group="hospital_admins", timeout=10 * 60)
    def retrieve(self, request, *args, **kwargs):
        """Retrieve a specific hospital admin."""
        return super().retrieve(request, *args, **kwargs)

    @swagger_auto_schema(
        tags=_TAG,
        request_body=HospitalAdminUpdateSerializer,
        responses={200: HospitalAdminDetailSerializer},
        operation_description="Partially update a Hospital Admin profile. Accessible by the hospital admin or a SYSTEM_ADMIN.",
    )
    def partial_update(self, request, *args, **kwargs):
        """Partially update a hospital admin."""
        return super().partial_update(request, *args, **kwargs)

    @swagger_auto_schema(
        tags=_TAG,
        request_body=HospitalAdminUpdateSerializer,
        responses={200: HospitalAdminDetailSerializer},
        operation_description="Fully update a Hospital Admin profile. Accessible by the hospital admin or a SYSTEM_ADMIN.",
    )
    def update(self, request, *args, **kwargs):
        """Fully update a hospital admin."""
        return super().update(request, *args, **kwargs)

    @action(
        detail=True,
        methods=["get"],
        permission_classes=[IsAuthenticated, IsOwnerOrSystemAdmin],
        url_path="dashboard",
    )
    @swagger_auto_schema(
        tags=["Dashboard"],
        operation_description="Get dashboard statistics for a hospital admin.",
        responses={200: HospitalAdminDashboardSerializer()},
    )
    def dashboard(self, request, id=None):
        hospital_admin = self.get_object()
        hospital = hospital_admin.hospital

        if not hospital:
            return Response({
                "redeemed_vouchers": 0,
                "issued_vouchers": 0,
                "total_claims": 0,
                "pending_claims": 0,
                "number_of_staff": 0,
            })

        redeemed_vouchers = Voucher.objects.filter(
            hospital=hospital,
            status=Voucher.Status.USED,
        ).count()

        issued_vouchers = Voucher.objects.filter(
            hospital=hospital,
        ).count()

        total_claims = MedicalClaim.objects.filter(
            hospital=hospital,
        ).count()

        pending_claims = MedicalClaim.objects.filter(
            hospital=hospital,
            claim_status="PENDING",
        ).count()

        from accounts.models import Receptionist
        admin_count = HospitalAdmin.objects.filter(
            hospital=hospital,
            is_active=True,
        ).count()
        receptionist_count = Receptionist.objects.filter(
            hospital=hospital,
        ).count()

        return Response({
            "redeemed_vouchers": redeemed_vouchers,
            "issued_vouchers": issued_vouchers,
            "total_claims": total_claims,
            "pending_claims": pending_claims,
            "number_of_staff": admin_count + receptionist_count,
        })
