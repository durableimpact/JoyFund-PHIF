from django.core.cache import cache
from django.utils.decorators import method_decorator
from drf_yasg.utils import swagger_auto_schema
from rest_framework import viewsets

from accounts.utils.permissions import IsSystemAdmin
from ..filters import PaymentGatewayFilter
from ..models import PaymentGateway
from ..serializers.gateway import PaymentGatewaySerializer

CACHE_TIMEOUT = 5 * 60  # 5 minutes
_tag = ['Payments — Gateways']


@method_decorator(name='list', decorator=swagger_auto_schema(
    tags=_tag, operation_summary="List Payment Gateways",
    operation_description=(
        "**Filters:** `is_active`\n\n"
        "**Search:** `name`, `description`\n\n"
        "**Ordering:** `name`, `created_at`"
    ),
))
@method_decorator(name='retrieve', decorator=swagger_auto_schema(
    tags=_tag, operation_summary="Get Payment Gateway",
))
@method_decorator(name='create', decorator=swagger_auto_schema(
    tags=_tag, operation_summary="Create Payment Gateway",
))
@method_decorator(name='update', decorator=swagger_auto_schema(
    tags=_tag, operation_summary="Update Payment Gateway",
))
@method_decorator(name='partial_update', decorator=swagger_auto_schema(
    tags=_tag, operation_summary="Partially Update Payment Gateway",
))
@method_decorator(name='destroy', decorator=swagger_auto_schema(
    tags=_tag, operation_summary="Delete Payment Gateway",
))
class PaymentGatewayViewSet(viewsets.ModelViewSet):
    """
    Full CRUD for Payment Gateways.
    Accessible by System Admins only.

    Gateways represent external payment providers (e.g. MTN Mobile Money,
    Orange Money) that process donations and disbursements.
    """
    queryset = PaymentGateway.objects.order_by('name')
    serializer_class = PaymentGatewaySerializer
    permission_classes = [IsSystemAdmin]
    filterset_class = PaymentGatewayFilter
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']

    @staticmethod
    def _get_list_cache_key():
        return 'gateway_list'

    @staticmethod
    def _get_detail_cache_key(gateway_id):
        return f'gateway_detail_{gateway_id}'

    @staticmethod
    def _invalidate_list_cache():
        cache.delete(PaymentGatewayViewSet._get_list_cache_key())

    @staticmethod
    def _invalidate_detail_cache(gateway_id):
        cache.delete(PaymentGatewayViewSet._get_detail_cache_key(gateway_id))

    def list(self, request, *args, **kwargs):
        cache_key = self._get_list_cache_key()
        cached_response = cache.get(cache_key)
        if cached_response is not None:
            return cached_response
        
        response = super().list(request, *args, **kwargs)
        cache.set(cache_key, response, CACHE_TIMEOUT)
        return response

    def retrieve(self, request, *args, **kwargs):
        gateway_id = kwargs.get('pk')
        cache_key = self._get_detail_cache_key(gateway_id)
        cached_response = cache.get(cache_key)
        if cached_response is not None:
            return cached_response
        
        response = super().retrieve(request, *args, **kwargs)
        cache.set(cache_key, response, CACHE_TIMEOUT)
        return response

    def perform_create(self, serializer):
        super().perform_create(serializer)
        self._invalidate_list_cache()

    def perform_update(self, serializer):
        super().perform_update(serializer)
        gateway_id = self.kwargs.get('pk')
        self._invalidate_detail_cache(gateway_id)
        self._invalidate_list_cache()

    def perform_destroy(self, instance):
        super().perform_destroy(instance)
        self._invalidate_detail_cache(instance.id)
        self._invalidate_list_cache()
