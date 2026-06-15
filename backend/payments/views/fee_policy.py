from core.mixins import CacheInvalidationMixin
from django.core.cache import cache
from django.utils.decorators import method_decorator
from drf_yasg.utils import swagger_auto_schema
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from accounts.utils.permissions import IsSystemAdmin
from ..filters import FeePolicyFilter
from ..models import FeePolicy
from ..serializers.fee_policy import FeePolicySerializer

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
class FeePolicyViewSet(CacheInvalidationMixin, viewsets.ModelViewSet):
    cache_timeout = 60

    """
    Full CRUD for Fee Policies.
    Accessible by System Admins only.

    Fee policies define how incoming donations are split between the
    platform fee account and the escrow account. The two percentages
    must always sum to 100.
    """
    cache_group = 'fee_policies'
    queryset = FeePolicy.objects.order_by('-created_at')
    serializer_class = FeePolicySerializer
    permission_classes = [IsSystemAdmin]
    filterset_class = FeePolicyFilter
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'platform_fee_percentage', 'escrow_fee_percentage', 'created_at']
    ordering = ['-created_at']

    def _build_response(self, serializer):
        data = serializer.data
        deactivated = getattr(serializer, 'validated_data', {}).get('_deactivates', None)
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

    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    @swagger_auto_schema(
        tags=_tag, operation_summary="Get Current Fee Policy",
        operation_description="Returns the most recent active fee policy (public, no auth required). Used by the frontend to display the platform fee to donors."
    )
    def current(self, request):
        policy = FeePolicy.objects.filter(is_active=True).order_by('-created_at').first()
        if not policy:
            return Response({'detail': 'No active fee policy found.'}, status=404)
        serializer = self.get_serializer(policy)
        return Response(serializer.data)
