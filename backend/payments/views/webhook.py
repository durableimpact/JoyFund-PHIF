from django.utils.decorators import method_decorator
from drf_yasg.utils import swagger_auto_schema
from rest_framework import viewsets, mixins

from accounts.utils.permissions import IsSystemAdmin
from ..filters import WebhookEventFilter
from ..models import WebhookEvent
from ..serializers.webhook import WebhookEventSerializer


@method_decorator(name='list', decorator=swagger_auto_schema(
    tags=['Payments — Webhooks'],
    operation_summary="List Webhook Events",
    operation_description=(
        "**Filters:** `gateway`, `event_type` (partial match), `received_after`, `received_before`\n\n"
        "**Search:** `event_type`\n\n"
        "**Ordering:** `event_type`, `received_at`"
    ),
))
@method_decorator(name='retrieve', decorator=swagger_auto_schema(
    tags=['Payments — Webhooks'], operation_summary="Get Webhook Event",
))
class WebhookEventViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    """
    Read-only access to inbound webhook events from payment gateways.
    Accessible by System Admins only.

    Webhook events are recorded automatically when a payment provider
    sends a callback. They cannot be created or modified via the API.
    """
    queryset = WebhookEvent.objects.select_related('gateway').order_by('-received_at')
    serializer_class = WebhookEventSerializer
    permission_classes = [IsSystemAdmin]
    filterset_class = WebhookEventFilter
    search_fields = ['event_type']
    ordering_fields = ['event_type', 'received_at']
    ordering = ['-received_at']
