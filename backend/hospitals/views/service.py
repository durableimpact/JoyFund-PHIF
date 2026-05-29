from django.utils.decorators import method_decorator
from core.mixins import CacheInvalidationMixin
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


@method_decorator(name='list', decorator=swagger_auto_schema(tags=_TAG))
@method_decorator(name='retrieve', decorator=swagger_auto_schema(tags=_TAG))
@method_decorator(name='create', decorator=swagger_auto_schema(tags=_TAG))
@method_decorator(name='update', decorator=swagger_auto_schema(tags=_TAG))
@method_decorator(name='partial_update', decorator=swagger_auto_schema(tags=_TAG))
@method_decorator(name='destroy', decorator=swagger_auto_schema(tags=_TAG))
class ServiceViewSet(CacheInvalidationMixin, viewsets.ModelViewSet):

    """
    ViewSet for managing hospital services.
    - Accessible by System Admins and Hospital Admins.
    - Services are nested under a hospital.
    """
    cache_group = 'services'
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
        self._invalidate_cache()

    def perform_update(self, serializer):
        hospital = get_object_or_404(Hospital, id=self.kwargs['hospital_pk'])
        serializer.save(hospital=hospital)
        self._invalidate_cache()
