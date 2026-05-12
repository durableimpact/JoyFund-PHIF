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
)
from accounts.utils import IsOwnerOrSystemAdmin, IsSystemAdmin, cache_response, invalidate_cache, make_cache_key

_TAG = ['Hospital Admins']


class HospitalAdminViewSet(
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
    
    queryset = HospitalAdmin.objects.select_related('user', 'enrolled_by__user', 'hospital').all().order_by('-user__created_at')
    lookup_field = 'id'
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = {
        'id': ['exact'],
        'hospital_id': ['exact', 'isnull'],
        'enrolled_by_id': ['exact'],
        'national_id_number': ['exact', 'icontains'],
        'user__email': ['exact', 'icontains'],
        'user__phone_number': ['exact', 'icontains'],
        'user__is_verified': ['exact'],
        'user__is_active': ['exact'],
        'user__created_at': ['date', 'gte', 'lte'],
    }
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
    @invalidate_cache(make_cache_key('hospital_admin_list'))
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
    @cache_response(timeout=5 * 60)
    def list(self, request, *args, **kwargs):
        """List all hospital admins with caching."""
        return super().list(request, *args, **kwargs)

    @swagger_auto_schema(
        tags=_TAG,
        responses={200: HospitalAdminDetailSerializer},
        operation_description="Retrieve a Hospital Admin profile. Accessible by the hospital admin or a SYSTEM_ADMIN.",
    )
    @cache_response(timeout=10 * 60)
    def retrieve(self, request, *args, **kwargs):
        """Retrieve a specific hospital admin."""
        return super().retrieve(request, *args, **kwargs)

    @swagger_auto_schema(
        tags=_TAG,
        request_body=HospitalAdminUpdateSerializer,
        responses={200: HospitalAdminDetailSerializer},
        operation_description="Partially update a Hospital Admin profile. Accessible by the hospital admin or a SYSTEM_ADMIN.",
    )
    @invalidate_cache(make_cache_key('hospital_admin_list'))
    def partial_update(self, request, *args, **kwargs):
        """Partially update a hospital admin."""
        return super().partial_update(request, *args, **kwargs)

    @swagger_auto_schema(
        tags=_TAG,
        request_body=HospitalAdminUpdateSerializer,
        responses={200: HospitalAdminDetailSerializer},
        operation_description="Fully update a Hospital Admin profile. Accessible by the hospital admin or a SYSTEM_ADMIN.",
    )
    @invalidate_cache(make_cache_key('hospital_admin_list'))
    def update(self, request, *args, **kwargs):
        """Fully update a hospital admin."""
        return super().update(request, *args, **kwargs)
