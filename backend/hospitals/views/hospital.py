from django_filters.rest_framework import DjangoFilterBackend
from drf_yasg.utils import swagger_auto_schema
from rest_framework import viewsets
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import BasePermission, IsAuthenticated

from accounts.models import Role
from hospitals.models import Hospital
from hospitals.serializers import HospitalCreateUpdateSerializer, HospitalDetailSerializer

_TAG = ['Hospitals']


class IsSystemOrHospitalAdmin(BasePermission):
    message = 'Only System Admins or Hospital Admins can perform this action.'

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role in {Role.SYSTEM_ADMIN, Role.HOSPITAL_ADMIN}
        )


class HospitalViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsSystemOrHospitalAdmin]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = {
        'id': ['exact'],
        'name': ['exact', 'icontains'],
        'region': ['exact', 'icontains'],
        'city': ['exact', 'icontains'],
        'partnership_status': ['exact'],
        'is_active': ['exact'],
        'created_at': ['date', 'gte', 'lte'],
        'updated_at': ['date', 'gte', 'lte'],
        'manager__id': ['exact', 'isnull'],
        'manager__user__email': ['exact', 'icontains'],
    }
    search_fields = ['name', 'address', 'email', 'phone_number', 'accreditation_number', 'licence_number']
    ordering_fields = ['created_at', 'updated_at', 'name', 'city', 'region']

    def get_queryset(self):
        return Hospital.objects.select_related('manager__user').all().order_by('-created_at')

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return HospitalCreateUpdateSerializer
        return HospitalDetailSerializer

    @swagger_auto_schema(tags=_TAG, responses={200: HospitalDetailSerializer(many=True)},
                         operation_description='List hospitals.')
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @swagger_auto_schema(tags=_TAG, request_body=HospitalCreateUpdateSerializer,
                         responses={201: HospitalDetailSerializer},
                         operation_description='Create a hospital.')
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)

    @swagger_auto_schema(tags=_TAG, responses={200: HospitalDetailSerializer},
                         operation_description='Retrieve a hospital.')
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

    @swagger_auto_schema(tags=_TAG, request_body=HospitalCreateUpdateSerializer,
                         responses={200: HospitalDetailSerializer},
                         operation_description='Replace a hospital.')
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)

    @swagger_auto_schema(tags=_TAG, request_body=HospitalCreateUpdateSerializer,
                         responses={200: HospitalDetailSerializer},
                         operation_description='Update a hospital.')
    def partial_update(self, request, *args, **kwargs):
        return super().partial_update(request, *args, **kwargs)

    @swagger_auto_schema(tags=_TAG, responses={204: 'No Content'},
                         operation_description='Delete a hospital.')
    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)
