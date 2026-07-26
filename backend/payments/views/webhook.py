import json
import logging
from django.utils.decorators import method_decorator
from drf_yasg.utils import swagger_auto_schema
from rest_framework import viewsets, mixins, status
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.utils.permissions import IsSystemAdmin
from core.cache import cache_response, invalidate_group
from ..filters import WebhookEventFilter
from ..models import WebhookEvent, PaymentGateway, Transaction
from ..serializers.webhook import WebhookEventListSerializer, WebhookEventSerializer

from ..tasks.process_payment import process_payment_task, process_disbursement_task
from rest_framework.permissions import AllowAny
from django.views.decorators.csrf import csrf_exempt

logger = logging.getLogger(__name__)


@method_decorator(
    name="list",
    decorator=swagger_auto_schema(
        tags=["Webhook"],
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
        tags=["Webhook"],
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
    permission_classes = [IsSystemAdmin]

    def get_serializer_class(self):
        if self.action == 'list':
            return WebhookEventListSerializer
        return WebhookEventSerializer
    filterset_class = WebhookEventFilter
    search_fields = ["event_type"]
    ordering_fields = ["event_type", "received_at"]
    ordering = ["-received_at"]

    @cache_response(group="webhook_events", timeout=60)
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @cache_response(group="webhook_events", timeout=60)
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)


@method_decorator(csrf_exempt, name='dispatch')
@method_decorator(
    name='post',
    decorator=swagger_auto_schema(
        tags=["Webhook"],
        operation_summary="Payment Provider Webhook (POST)",
        operation_description=(
            "Receives and processes payment notifications from payment providers.\n\n"
            "**Content-Type:** application/json or application/x-www-form-urlencoded"
        ),
    ),
)
@method_decorator(
    name='get',
    decorator=swagger_auto_schema(
        tags=["Webhook"],
        operation_summary="Payment Provider Webhook (GET)",
        operation_description=(
            "Health check endpoint for webhook.\n\n"
            "Accepts GET requests to verify webhook endpoint is ready. "
            "Also accepts payment notifications via query parameters."
        ),
    ),
)
class PaymentWebhookView(APIView):
    """
    Webhook to handle payment notifications from payment providers.
    Supports both POST (JSON/Form) and GET (Query Parameters).
    """
    permission_classes = [AllowAny]

    def get(self, request):
        """Health check or process GET notifications if parameters are provided"""
        if request.GET:
            logger.info(f"Received webhook via GET: {request.GET.dict()}")
            return self._process_webhook_data(request.GET.dict())
        
        return Response(
            {"status": "ok", "message": "Webhook endpoint is ready"},
            status=status.HTTP_200_OK,
        )

    def post(self, request):
        """
        Process payment notifications via POST
        """
        try:
            # Extract data from POST or JSON body
            if request.content_type and "application/json" in request.content_type:
                webhook_data = json.loads(request.body)
            else:
                webhook_data = request.POST.dict()

            logger.info(f"Received webhook via POST: {webhook_data}")
            return self._process_webhook_data(webhook_data)

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

    def _process_webhook_data(self, webhook_data):
        """
        Core logic to record event and queue task.
        """
        if not webhook_data:
            logger.warning("Received empty webhook payload")
            return Response(
                {"status": "error", "message": "Empty webhook payload"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            # 1. Record the raw event for audit trail
            gateway, _ = PaymentGateway.objects.get_or_create(name="CamPay")
            WebhookEvent.objects.create(
                gateway=gateway, 
                event_type="payment_notification", 
                payload=webhook_data
            )
            invalidate_group("webhook_events")
            
            # 2. Determine target task (Donation or Disbursement)
            ext_ref = webhook_data.get("external_reference")
            target_task = process_payment_task
            
            if ext_ref:
                # Check if it's a disbursement via Transaction
                # Validating UUID format to prevent database errors
                try:
                    if Transaction.objects.filter(id=ext_ref, type='DISBURSEMENT').exists():
                        target_task = process_disbursement_task
                except (ValueError, TypeError):
                    # Not a valid UUID, so definitely not a Transaction ID
                    pass

            # 3. Queue processing asynchronously
            result = target_task.delay(webhook_data)
            logger.info(f"Task {target_task.__name__} queued with ID: {result.id} for ref: {ext_ref}")

            return Response(
                {
                    "status": "success",
                    "message": "Payment notification received and queued",
                    "task_id": result.id,
                },
                status=status.HTTP_202_ACCEPTED,
            )
        except Exception as e:
            logger.exception(f"Error processing webhook data: {str(e)}")
            return Response(
                {"status": "error", "message": "Error queueing payment processing"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
