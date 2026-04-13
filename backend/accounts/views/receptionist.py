from django.core.cache import cache
from drf_yasg.utils import swagger_auto_schema
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework import status
from rest_framework.generics import ListAPIView, RetrieveAPIView, UpdateAPIView
from rest_framework.permissions import BasePermission, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import Receptionist, Role
from accounts.serializers import (
    ReceptionistCreateSerializer,
    ReceptionistDetailSerializer,
    ReceptionistUpdateSerializer,
)
from accounts.utils import IsHospitalAdmin, IsOwnerOrHospitalAdmin

_TAG = ['Receptionists']
CACHE_TIMEOUT = 5 * 60  # 5 minutes


class IsHospitalAdminOrSystemAdmin(BasePermission):
    message = 'Only Hospital Admins or System Admins can perform this action.'

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role in {Role.HOSPITAL_ADMIN, Role.SYSTEM_ADMIN}
        )


class ReceptionistCreateView(APIView):
    """
    POST /api/accounts/receptionists/
    Only HOSPITAL_ADMIN can create a Receptionist account.
    The `enrolled_by` field is automatically set to the requesting hospital admin.
    """

    permission_classes = [IsAuthenticated, IsHospitalAdmin]

    @staticmethod
    def _invalidate_list_cache():
        """Invalidate receptionist list cache"""
        cache.delete('receptionist_list')

    @swagger_auto_schema(
        tags=_TAG,
        request_body=ReceptionistCreateSerializer,
        responses={201: ReceptionistDetailSerializer},
        operation_description="Create a new Receptionist account. Only accessible by HOSPITAL_ADMIN.",
    )
    def post(self, request):
        try:
            enrolled_by = request.user.hospitaladmin
        except Exception:
            return Response(
                {'detail': 'Requesting user does not have a HospitalAdmin profile.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = ReceptionistCreateSerializer(
            data=request.data,
            context={'enrolled_by': enrolled_by},
        )
        serializer.is_valid(raise_exception=True)
        receptionist = serializer.save()
        self._invalidate_list_cache()
        return Response(
            ReceptionistDetailSerializer(receptionist).data,
            status=status.HTTP_201_CREATED,
        )


class ReceptionistListView(ListAPIView):
    """
    GET /api/accounts/receptionists/list/
    Accessible by HOSPITAL_ADMIN and SYSTEM_ADMIN.
    """

    serializer_class = ReceptionistDetailSerializer
    permission_classes = [IsAuthenticated, IsHospitalAdminOrSystemAdmin]
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

    @staticmethod
    def _get_cache_key():
        """Get cache key for receptionist list"""
        return 'receptionist_list'

    def get_queryset(self):
        # Handle schema generation for Swagger
        if getattr(self, 'swagger_fake_view', False):
            return Receptionist.objects.none()
        
        queryset = Receptionist.objects.select_related('user', 'enrolled_by__user', 'hospital').all().order_by('-user__date_joined')
        if self.request.user.role == Role.SYSTEM_ADMIN:
            return queryset
        return queryset.filter(enrolled_by__user=self.request.user)

    @swagger_auto_schema(
        tags=_TAG,
        responses={200: ReceptionistDetailSerializer(many=True)},
        operation_description='List Receptionist profiles. SYSTEM_ADMIN sees all; HOSPITAL_ADMIN sees only their enrolled receptionists.',
    )
    def get(self, request, *args, **kwargs):
        cache_key = self._get_cache_key()
        cached_response = cache.get(cache_key)
        if cached_response is not None:
            return cached_response
        
        response = super().get(request, *args, **kwargs)
        cache.set(cache_key, response, CACHE_TIMEOUT)
        return response


class ReceptionistDetailView(RetrieveAPIView):
    """
    GET /api/accounts/receptionists/<id>/
    Accessible by the receptionist themselves, their enrolling hospital admin,
    or a SYSTEM_ADMIN.
    """

    queryset = Receptionist.objects.select_related('user', 'enrolled_by__user', 'hospital')
    serializer_class = ReceptionistDetailSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrHospitalAdmin]
    lookup_field = 'id'

    @staticmethod
    def _get_list_cache_key():
        """Get cache key for receptionist list"""
        return 'receptionist_list'

    @staticmethod
    def _get_detail_cache_key(receptionist_id):
        """Get cache key for receptionist detail"""
        return f'receptionist_detail_{receptionist_id}'

    @swagger_auto_schema(
        tags=_TAG,
        responses={200: ReceptionistDetailSerializer},
        operation_description="Retrieve a Receptionist profile. Accessible by the receptionist, their hospital admin, or a SYSTEM_ADMIN.",
    )
    def get(self, request, *args, **kwargs):
        receptionist_id = kwargs.get('id')
        cache_key = self._get_detail_cache_key(receptionist_id)
        cached_response = cache.get(cache_key)
        if cached_response is not None:
            return cached_response
        
        response = super().get(request, *args, **kwargs)
        cache.set(cache_key, response, CACHE_TIMEOUT)
        return response


class ReceptionistUpdateView(UpdateAPIView):
    """
    PATCH /api/accounts/receptionists/<id>/update/
    Accessible by the receptionist themselves, their enrolling hospital admin,
    or a SYSTEM_ADMIN.
    """

    queryset = Receptionist.objects.select_related('user')
    serializer_class = ReceptionistUpdateSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrHospitalAdmin]
    lookup_field = 'id'
    http_method_names = ['patch', 'head', 'options']

    @staticmethod
    def _invalidate_list_cache():
        """Invalidate receptionist list cache"""
        cache.delete('receptionist_list')

    @staticmethod
    def _invalidate_detail_cache(receptionist_id):
        """Invalidate receptionist detail cache"""
        cache.delete(f'receptionist_detail_{receptionist_id}')

    @swagger_auto_schema(
        tags=_TAG,
        request_body=ReceptionistUpdateSerializer,
        responses={200: ReceptionistDetailSerializer},
        operation_description="Partially update a Receptionist profile. Accessible by the receptionist, their hospital admin, or a SYSTEM_ADMIN.",
    )
    def patch(self, request, *args, **kwargs):
        receptionist_id = kwargs.get('id')
        response = super().patch(request, *args, **kwargs)
        self._invalidate_list_cache()
        self._invalidate_detail_cache(receptionist_id)
        return response
