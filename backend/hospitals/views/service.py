from django.shortcuts import get_object_or_404
from django.core.cache import cache
from django_filters.rest_framework import DjangoFilterBackend
from drf_yasg.utils import swagger_auto_schema
from rest_framework import viewsets
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import IsAuthenticated

from hospitals.models import Hospital, Services
from hospitals.serializers import ServiceCreateUpdateSerializer, ServiceDetailSerializer
from .hospital import IsSystemOrHospitalAdmin

_TAG = ['Services']
CACHE_TIMEOUT = 3 * 24 * 60 * 60  # 3 days


class ServiceViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing hospital services.
    - Accessible by System Admins and Hospital Admins.
    - Services are nested under a hospital.
    """
    permission_classes = [IsAuthenticated, IsSystemOrHospitalAdmin]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = {
        'id': ['exact'],
        'name': ['exact', 'icontains'],
        'category': ['exact', 'icontains'],
        'is_available': ['exact'],
        'price': ['exact', 'gte', 'lte'],
        'created_at': ['date', 'gte', 'lte'],
        'updated_at': ['date', 'gte', 'lte'],
    }
    search_fields = ['name', 'category', 'description']
    ordering_fields = ['created_at', 'updated_at', 'price', 'name', 'category']

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return ServiceCreateUpdateSerializer
        return ServiceDetailSerializer

    @staticmethod
    def _get_list_cache_key(hospital_id):
        """Get cache key for services list under a hospital"""
        return f'service_list_hospital_{hospital_id}'

    @staticmethod
    def _get_detail_cache_key(hospital_id, service_id):
        """Get cache key for service detail with hospital context"""
        return f'service_detail_hospital_{hospital_id}_{service_id}'

    @staticmethod
    def _invalidate_hospital_services_list(hospital_id):
        """Invalidate services list cache for a hospital"""
        cache.delete(ServiceViewSet._get_list_cache_key(hospital_id))

    @staticmethod
    def _invalidate_detail_cache(hospital_id, service_id):
        """Invalidate specific service detail cache for a hospital"""
        cache.delete(ServiceViewSet._get_detail_cache_key(hospital_id, service_id))

    def get_queryset(self):
        # Handle schema generation for Swagger
        if getattr(self, 'swagger_fake_view', False):
            return Services.objects.none()
        
        return Services.objects.select_related('hospital').filter(
            hospital_id=self.kwargs['hospital_pk']
        ).order_by('-created_at')

    def perform_create(self, serializer):
        hospital = get_object_or_404(Hospital, id=self.kwargs['hospital_pk'])
        serializer.save(hospital=hospital)

    def perform_update(self, serializer):
        hospital = get_object_or_404(Hospital, id=self.kwargs['hospital_pk'])
        serializer.save(hospital=hospital)

    @swagger_auto_schema(tags=_TAG, responses={200: ServiceDetailSerializer(many=True)},
                         operation_description='List services under a hospital.')
    def list(self, request, *args, **kwargs):
        hospital_id = self.kwargs.get('hospital_pk')
        cache_key = self._get_list_cache_key(hospital_id)
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            from rest_framework.response import Response
            return Response(cached_data)
        
        response = super().list(request, *args, **kwargs)
        cache.set(cache_key, response.data, CACHE_TIMEOUT)
        return response

    @swagger_auto_schema(tags=_TAG, request_body=ServiceCreateUpdateSerializer,
                         responses={201: ServiceDetailSerializer},
                         operation_description='Create a service under a hospital.')
    def create(self, request, *args, **kwargs):
        hospital_id = self.kwargs.get('hospital_pk')
        response = super().create(request, *args, **kwargs)
        self._invalidate_hospital_services_list(hospital_id)
        return response

    @swagger_auto_schema(tags=_TAG, responses={200: ServiceDetailSerializer},
                         operation_description='Retrieve a service under a hospital.')
    def retrieve(self, request, *args, **kwargs):
        hospital_id = self.kwargs.get('hospital_pk')
        service_id = kwargs.get('pk')
        cache_key = self._get_detail_cache_key(hospital_id, service_id)
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            from rest_framework.response import Response
            return Response(cached_data)
        
        response = super().retrieve(request, *args, **kwargs)
        cache.set(cache_key, response.data, CACHE_TIMEOUT)
        return response

    @swagger_auto_schema(tags=_TAG, request_body=ServiceCreateUpdateSerializer,
                         responses={200: ServiceDetailSerializer},
                         operation_description='Replace a service under a hospital.')
    def update(self, request, *args, **kwargs):
        hospital_id = self.kwargs.get('hospital_pk')
        service_id = kwargs.get('pk')
        response = super().update(request, *args, **kwargs)
        self._invalidate_hospital_services_list(hospital_id)
        self._invalidate_detail_cache(hospital_id, service_id)
        return response

    @swagger_auto_schema(tags=_TAG, request_body=ServiceCreateUpdateSerializer,
                         responses={200: ServiceDetailSerializer},
                         operation_description='Update a service under a hospital.')
    def partial_update(self, request, *args, **kwargs):
        hospital_id = self.kwargs.get('hospital_pk')
        service_id = kwargs.get('pk')
        response = super().partial_update(request, *args, **kwargs)
        self._invalidate_hospital_services_list(hospital_id)
        self._invalidate_detail_cache(hospital_id, service_id)
        return response

    @swagger_auto_schema(tags=_TAG, responses={204: 'No Content'},
                         operation_description='Delete a service under a hospital.')
    def destroy(self, request, *args, **kwargs):
        hospital_id = self.kwargs.get('hospital_pk')
        service_id = kwargs.get('pk')
        response = super().destroy(request, *args, **kwargs)
        self._invalidate_hospital_services_list(hospital_id)
        self._invalidate_detail_cache(hospital_id, service_id)
        return response
