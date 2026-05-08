from django.core.cache import cache
from django.utils.decorators import method_decorator
from drf_yasg.utils import swagger_auto_schema
from rest_framework import viewsets
from rest_framework.response import Response

from accounts.utils.permissions import IsSystemAdmin
from ..filters import FeePolicyFilter
from ..models import FeePolicy
from ..serializers.fee_policy import FeePolicySerializer

CACHE_TIMEOUT = 5 * 60  # 5 minutes
_tag = ['Payments — Fee Policies']


@method_decorator(name='list', decorator=swagger_auto_schema(
    tags=_tag, operation_summary="List Fee Policies",
    operation_description=(
        "**Filters:** `is_active`, `created_after`, `created_before`\n\n"
        "**Search:** `name`, `description`\n\n"
        "**Ordering:** `name`, `platform_fee_percentage`, `escrow_fee_percentage`, `created_at`"
    ),
))
@method_decorator(name='retrieve', decorator=swagger_auto_schema(
    tags=_tag, operation_summary="Get Fee Policy",
))
@method_decorator(name='create', decorator=swagger_auto_schema(
    tags=_tag, operation_summary="Create Fee Policy",
))
@method_decorator(name='update', decorator=swagger_auto_schema(
    tags=_tag, operation_summary="Update Fee Policy",
))
@method_decorator(name='partial_update', decorator=swagger_auto_schema(
    tags=_tag, operation_summary="Partially Update Fee Policy",
))
@method_decorator(name='destroy', decorator=swagger_auto_schema(
    tags=_tag, operation_summary="Delete Fee Policy",
))
class FeePolicyViewSet(viewsets.ModelViewSet):
    """
    Full CRUD for Fee Policies.
    Accessible by System Admins only.

    Fee policies define how incoming donations are split between the
    platform fee account and the escrow account. The two percentages
    must always sum to 100.
    """
    queryset = FeePolicy.objects.order_by('-created_at')
    serializer_class = FeePolicySerializer
    permission_classes = [IsSystemAdmin]
    filterset_class = FeePolicyFilter
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'platform_fee_percentage', 'escrow_fee_percentage', 'created_at']
    ordering = ['-created_at']

    @staticmethod
    def _get_list_cache_key():
        return 'fee_policy_list'

    @staticmethod
    def _get_detail_cache_key(policy_id):
        return f'fee_policy_detail_{policy_id}'

    @staticmethod
    def _invalidate_list_cache():
        cache.delete(FeePolicyViewSet._get_list_cache_key())

    @staticmethod
    def _invalidate_detail_cache(policy_id):
        cache.delete(FeePolicyViewSet._get_detail_cache_key(policy_id))

    def list(self, request, *args, **kwargs):
        cache_key = self._get_list_cache_key()
        cached_response = cache.get(cache_key)
        if cached_response is not None:
            return cached_response
        
        response = super().list(request, *args, **kwargs)
        cache.set(cache_key, response, CACHE_TIMEOUT)
        return response

    def retrieve(self, request, *args, **kwargs):
        policy_id = kwargs.get('pk')
        cache_key = self._get_detail_cache_key(policy_id)
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
        policy_id = self.kwargs.get('pk')
        self._invalidate_detail_cache(policy_id)
        self._invalidate_list_cache()

    def perform_destroy(self, instance):
        super().perform_destroy(instance)
        self._invalidate_detail_cache(instance.id)
        self._invalidate_list_cache()
        data = serializer.data
        deactivated = serializer.validated_data.pop('_deactivates', None)
        if deactivated:
            data = dict(data)
            data['warning'] = f"Fee policy '{deactivated}' has been deactivated."
        return data

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response(self._build_response(serializer), status=201)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(self._build_response(serializer))
