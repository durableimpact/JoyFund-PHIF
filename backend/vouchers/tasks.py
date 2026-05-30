from celery import shared_task
import logging
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from datetime import datetime
from django.apps import apps
from utils.sms import sms_service

logger = logging.getLogger(__name__)
channel_layer = get_channel_layer()

@shared_task(name="vouchers.tasks.send_voucher_sms_task")
def send_voucher_sms_task(voucher_id):
    """
    Sends an SMS to the beneficiary when a voucher is created.
    """
    Voucher = apps.get_model('vouchers', 'Voucher')
    try:
        voucher = Voucher.objects.select_related('beneficiary', 'hospital').get(id=voucher_id)
        beneficiary = voucher.beneficiary
        hospital = voucher.hospital
        
        # Construct the message based on language preference
        if voucher.language_preference == 'en':
            message = (
                f"Hello {beneficiary.full_name}, your JoyFund voucher code is {voucher.voucher_code}. "
                f"Please present this at {hospital.name if hospital else 'the hospital'}. "
                "Thank you!"
            )
        else:  # Default to French
            message = (
                f"Bonjour {beneficiary.full_name}, votre code de bon JoyFund est {voucher.voucher_code}. "
                f"Veuillez le presenter a {hospital.name if hospital else 'l\'hopital'}. "
                "Merci!"
            )
            
        success = sms_service.send_sms(beneficiary.phone, message)
        if success:
            logger.info(f"Successfully sent voucher SMS for voucher {voucher_id}")
        else:
            logger.warning(f"Failed to send voucher SMS for voucher {voucher_id}")
            
    except Voucher.DoesNotExist:
        logger.error(f"Voucher with id {voucher_id} does not exist")
    except Exception as e:
        logger.error(f"An error occurred while sending voucher SMS: {e}")