from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Voucher
from .tasks import send_voucher_sms_task
import logging

logger = logging.getLogger(__name__)

@receiver(post_save, sender=Voucher)
def trigger_voucher_sms(sender, instance, created, **kwargs):
    """
    Triggers the send_voucher_sms_task when a new voucher is created.
    """
    if created:
        try:
            # Trigger the task asynchronously
            send_voucher_sms_task.delay(instance.id)
            logger.info(f"Triggered SMS task for voucher {instance.id}")
        except Exception as e:
            # We don't want to break the main flow if Celery task triggering fails
            logger.error(f"Failed to trigger SMS task for voucher {instance.id}: {e}")
