from django.utils.decorators import method_decorator
from drf_yasg.utils import swagger_auto_schema
from rest_framework import viewsets

from accounts.utils.permissions import IsSystemAdmin
from ..filters import PaymentGatewayFilter
from ..models import PaymentGateway
from ..serializers.gateway import PaymentGatewaySerializer

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
