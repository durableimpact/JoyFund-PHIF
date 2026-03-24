import json
import logging
from django.utils.decorators import method_decorator
from drf_yasg.utils import swagger_auto_schema
from rest_framework import viewsets, mixins, status
from rest_framework.response import Response

from accounts.utils.permissions import IsSystemAdmin
from ..filters import WebhookEventFilter
from ..models import WebhookEvent, PaymentGateway
from ..serializers.webhook import WebhookEventSerializer

from ..tasks.process_payment import process_payment_task
from rest_framework.permissions import AllowAny
from rest_framework.decorators import api_view, permission_classes
from django.views.decorators.csrf import csrf_exempt

logger = logging.getLogger(__name__)


@method_decorator(
    name="list",
    decorator=swagger_auto_schema(
        tags=["Payments — Webhooks"],
        operation_summary="List Webhook Events",
        operation_description=(
            "**Filters:** `gateway`, `event_type` (partial match), `received_after`, `received_before`\n\n"
            "**Search:** `event_type`\n\n"
            "**Ordering:** `event_type`, `received_at`"
        ),
    ),
)
@method_decorator(
    name="retrieve",
    decorator=swagger_auto_schema(
        tags=["Payments — Webhooks"],
        operation_summary="Get Webhook Event",
    ),
)
class WebhookEventViewSet(
    mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet
):
    """
    Read-only access to inbound webhook events from payment gateways.
    Accessible by System Admins only.

    Webhook events are recorded automatically when a payment provider
    sends a callback. They cannot be created or modified via the API.
    """

    queryset = WebhookEvent.objects.select_related("gateway").order_by("-received_at")
    serializer_class = WebhookEventSerializer
    permission_classes = [IsSystemAdmin]
    filterset_class = WebhookEventFilter
    search_fields = ["event_type"]
    ordering_fields = ["event_type", "received_at"]
    ordering = ["-received_at"]


@swagger_auto_schema(
    method="post",
    tags=["Payments — Webhooks"],
    operation_summary="Payment Provider Webhook",
    operation_description=(
        "Receives and processes payment notifications from payment providers.\n\n"
        "Accepts both GET and POST requests with payment data.\n\n"
        "**Content-Type:** application/json or application/x-www-form-urlencoded"
    ),
)
@csrf_exempt
@api_view(["POST", "GET", "PUT", "PATCH", "DELETE"])
@permission_classes([AllowAny])
def payment_webhook(request):
    """
    Webhook to handle payment notifications from payment providers
    """
    try:
        # Extract data from GET, POST, or JSON body
        if request.method == "GET":
            webhook_data = request.GET.dict()
        elif request.method == "POST":
            if request.content_type and "application/json" in request.content_type:
                webhook_data = json.loads(request.body)
            else:
                webhook_data = request.POST.dict()
        else:
            # For other methods, just return success (health checks)
            return Response(
                {"status": "ok", "message": "Webhook endpoint is ready"},
                status=status.HTTP_200_OK,
            )

        if not webhook_data:
            logger.warning("Received empty webhook payload")
            return Response(
                {"status": "error", "message": "Empty webhook payload"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        gateway, _ = PaymentGateway.objects.get_or_create(name="CamPay")
        WebhookEvent.objects.create(
            gateway=gateway, event_type="payment_notification", payload=webhook_data
        )

        logger.info(f"Received webhook data: {webhook_data}")

        # Queue payment processing using Celery
        result = process_payment_task.delay(webhook_data)
        logger.info(f"Task queued with ID: {result.id}")

        return Response(
            {
                "status": "success",
                "message": "Payment queued for processing",
                "task_id": result.id,
            },
            status=status.HTTP_202_ACCEPTED,
        )

    except json.JSONDecodeError as e:
        logger.error(f"Invalid JSON in webhook: {str(e)}")
        return Response(
            {"status": "error", "message": "Invalid JSON payload"},
            status=status.HTTP_400_BAD_REQUEST,
        )
    except Exception as e:
        logger.error(f"Payment webhook error: {str(e)}")
        return Response(
            {"status": "error", "message": "Internal server error"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
