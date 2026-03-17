from django.utils.decorators import method_decorator
from drf_yasg.utils import swagger_auto_schema
from rest_framework import viewsets
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

    def _build_response(self, serializer):
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
