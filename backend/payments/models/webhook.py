from django.db import models
from .gateway import PaymentGateway

class WebhookEvent(models.Model):
    id = models.AutoField(primary_key=True)
    gateway = models.ForeignKey(
        PaymentGateway, on_delete=models.CASCADE, related_name='webhook_events')
    # e.g. "payment_success", "payment_failed", etc.
    event_type = models.CharField(max_length=255)
    payload = models.JSONField()  # Raw JSON payload from the payment provider
    received_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"WebhookEvent {self.event_type} from {self.gateway.name} at {self.received_at}"
