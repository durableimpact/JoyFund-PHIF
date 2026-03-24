import logging
from celery import shared_task
from django.utils import timezone
from campaigns.models import Donation,Payment
import json


logger = logging.getLogger(__name__)

@shared_task
def process_payment_task(webhook_data:dict):
    """
    Process payment webhook data asynchronously using PaymentReference model
    """
    
    try:
        logger.info(f"Starting process_payment_task with webhook_data : {webhook_data}")
        
        # Extract key information from webhook
        campay_reference = webhook_data.get("reference")
        external_reference = webhook_data.get("external_reference")
        status = webhook_data.get("status")
        operator = webhook_data.get('operator','')
        
        if not external_reference:
            logger.error("Missing external_reference in webhook data")
            return {'status': 'error', 'message': 'Missing external_reference in webhook data'}
    
        try:
            donation = Donation.objects.get(id=external_reference)
            
        except Exception as e:
            logger.error(f"Donation couldn't be find from the external reference {external_reference}")
            return {'status':'error','message':f"Donation couldn't be find from the external reference {external_reference}"}
        
        payment = donation.payment
            
        payment.payment_reference = campay_reference
        
        if status == 'SUCCESSFUL':
            
            
            payment.payment_status = "SUCCESS"
            payment.save()
            
            donation.status = "SUCCESS"
            
            donation.save()
            
            return {
                'status':'success',
                'message':'Donation process successfully',
                'donation_id':donation.donation_id,
            }
            
        else:
            
            payment.payment_status = 'FAILED'
            payment.save()
            
            donation.status = 'FAILED'
            donation.save()
            
            return {
                'status':'failed',
                'message':'Donation failed',
                'donation_id':donation.donation_id,
            }
    
    except Exception as e:
        logger.exception(f"Error processing payment: {str(e)}")
        return {'status': 'error', 'message': str(e)}
    
    
    
@shared_task
def check_pending_donations():
    """
    Check for donations that have been in PENDING state for more than 30 mininutes and mark them as FAILED.
    """
    
    try:
        # Calculate the cutoff time (30 minutes ago)
        cutoff_time = timezone.now() - timezone.timedelta(minutes=30)
        
        # Find pending donations older than cutoff time
        
        pending_donations = Donation.objects.filter(status='PENDING',created_at__lt=cutoff_time)
        
        count = pending_donations.count()
        
        logger.info(f"Found {count} pending donations older than 30 minutes")
        
        pending_donations.update(status='FAILED')
        
        return {
            'status': 'success',
            'message': f'Marked {count} pending donations as FAILED',
            'count': count
        }
        
    
    except Exception as e:
        logger.exception(f"Error checking pending donations: {str(e)}")
        return {
            'status': 'error',
            'message': f'Error checking pending donations: {str(e)}'
        }