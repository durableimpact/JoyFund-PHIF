from drf_yasg.utils import swagger_auto_schema
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework import status, viewsets, mixins
from rest_framework.permissions import BasePermission, IsAuthenticated
from rest_framework.response import Response

from accounts.models import Receptionist, Role
from accounts.serializers import (
    ReceptionistCreateSerializer,
    ReceptionistDetailSerializer,
    ReceptionistUpdateSerializer,
)
from accounts.utils import IsHospitalAdmin, IsOwnerOrHospitalAdmin, cache_response, invalidate_cache, make_cache_key
from accounts.filters import ReceptionistFilter

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
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    mixins.CreateModelMixin,
    viewsets.GenericViewSet,
):
    """
    ViewSet for Receptionist management.
    """
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
    @invalidate_cache(make_cache_key('receptionist_list'))
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
    @cache_response(timeout=5 * 60)
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @swagger_auto_schema(
        tags=_TAG,
        responses={200: ReceptionistDetailSerializer},
        operation_description="Retrieve a Receptionist profile. Accessible by the receptionist, their hospital admin, or a SYSTEM_ADMIN.",
    )
    @cache_response(timeout=10 * 60)
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

    @swagger_auto_schema(
        tags=_TAG,
        request_body=ReceptionistUpdateSerializer,
        responses={200: ReceptionistDetailSerializer},
        operation_description="Partially update a Receptionist profile. Accessible by the receptionist, their hospital admin, or a SYSTEM_ADMIN.",
    )
    @invalidate_cache(make_cache_key('receptionist_list'))
    def partial_update(self, request, *args, **kwargs):
        return super().partial_update(request, *args, **kwargs)

    @swagger_auto_schema(
        tags=_TAG,
        request_body=ReceptionistUpdateSerializer,
        responses={200: ReceptionistDetailSerializer},
        operation_description="Fully update a Receptionist profile. Accessible by the receptionist, their hospital admin, or a SYSTEM_ADMIN.",
    )
    @invalidate_cache(make_cache_key('receptionist_list'))
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)
