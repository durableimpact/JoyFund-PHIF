import logging
from celery import shared_task
from django.utils import timezone
from datetime import timedelta
from campaigns.models import Campaign, Donation
from accounts.models import User
from utils.pdf_generator import create_impact_certificate

logger = logging.getLogger(__name__)

@shared_task
def send_anniversary_reminders():
    """
    Scans for milestone campaigns that were created around this time last year.
    Sends automated reminders to the campaign owner to make an impact tradition.
    """
    today = timezone.now().date()
    # Looking for a campaign created 351 days ago (14 days before 1-year mark)
    reminder_target = today - timedelta(days=351)
    
    campaigns = Campaign.objects.filter(
        created_at__date=reminder_target,
        status='CLOSED' 
    )
    
    count = 0
    for campaign in campaigns:
        donor = campaign.donor 
        
        # In a real system, you'd send an Email or SMS here via notifications app
        message = (
            f"Hi {donor.user.first_name}, your JoyFund campaign for '{campaign.title}' "
            f"saved lives last year! Your anniversary is coming up in 2 weeks. "
            f"Want to make it an annual tradition?"
        )
        logger.info(f"Sending anniversary reminder to {donor.user.email}: {message}")
        
        count += 1
        
    return f"Sent {count} anniversary reminders."

@shared_task
def generate_impact_certificates():
    """
    Scans for closed/funded campaigns that haven't had their impact certificate generated.
    """
    campaigns = Campaign.objects.filter(status='CLOSED', certificate_generated=False)
    
    count = 0
    for campaign in campaigns:
        # 1. Generate the PDF
        filename, content_file = create_impact_certificate(campaign)
        
        # 2. Save to model
        campaign.certificate_file.save(filename, content_file, save=False)
        campaign.certificate_generated = True
        campaign.save()
        
        logger.info(f"Generated Impact Certificate for Campaign #{campaign.id}")
        count += 1
        
    return f"Generated {count} impact certificates."
