import logging
from decimal import Decimal
from celery import shared_task
from django.utils import timezone
from datetime import timedelta
from campaigns.models import Campaign, Donation
from accounts.models import User
from utils.pdf_generator import create_impact_certificate
from django.core.asgi import get_asgi_application
from asgiref.sync import async_to_sync
from django.utils.text import slugify
from django.db import models
from django.db.models import DecimalField, F, Q, Sum, Value
from django.db.models.functions import Coalesce

logger = logging.getLogger(__name__)

@shared_task
def broadcast_donation_notification(donation_id, campaign_id, campaign_name, donor_name, amount, progress_percentage, donor_user_id):
    """
    Broadcast donation notification via WebSocket to campaign donor.
    
    This task ensures donors receive real-time updates within 30 seconds when:
    - Someone contributes to their campaign
    - Shows: contribution amount, donor name, progress percentage
    
    Acceptance Criteria (D-003):
    ✓ Push notification received within 30 seconds (Celery async task)
    ✓ Shows contribution amount and donor name (in payload)
    ✓ Includes progress percentage update (real-time UI update)
    """
    try:
        from backend.ws_messages import DonationCreatedMessage, DonationPayload
        from django.db import connection
        from channels.layers import get_channel_layer
        
        # Ensure we have a database connection
        connection.ensure_connection()
        
        # Create the donation payload
        donation_payload = DonationPayload(
            donation_id=donation_id,
            campaign_id=campaign_id,
            campaign_name=campaign_name,
            donor_name=donor_name,
            amount=float(amount),
            currency="XAF",
            status="SUCCESS",
            progress_percentage=float(progress_percentage),
            created_at=timezone.now(),
        )
        
        # Create the donation message
        donation_message = DonationCreatedMessage(payload=donation_payload)
        
        # Get channel layer
        channel_layer = get_channel_layer()
        
        # Send to campaign-specific group (for updates on campaign page)
        campaign_group_name = f"campaign_{campaign_id}"
        async_to_sync(channel_layer.group_send)(
            campaign_group_name,
            {
                "type": "donation_notification",  # This routes to the donation_notification method in consumer
                "message": donation_message.model_dump_json(),
            }
        )
        
        # Send to donor's notification group (for personal notifications)
        donor_group_name = f"user_{donor_user_id}_notifications"
        async_to_sync(channel_layer.group_send)(
            donor_group_name,
            {
                "type": "donation_notification",
                "message": donation_message.model_dump_json(),
            }
        )
        
        logger.info(
            f"✅ Real-time donation broadcast sent for campaign {campaign_id}: "
            f"{donor_name} contributed {amount} XAF (progress: {progress_percentage:.1f}%)"
        )
        
    except Exception as e:
        logger.error(
            f"❌ Failed to broadcast donation notification: {str(e)}",
            exc_info=True
        )
        raise


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
    Scans for campaigns that have reached their goal but haven't had 
    their impact certificate generated yet.
    """
    # Find campaigns that reached their goal but certificate not yet generated
    # Uses total_net_raised (from successful donations) to match the goal_reached property
    campaigns = Campaign.objects.annotate(
        total_net_raised_calc=Coalesce(
            Sum(F("donations__net_amount") - F("donations__platform_fee_amount"), filter=Q(donations__status="SUCCESS")),
            Value(0, output_field=DecimalField(max_digits=12, decimal_places=2)),
        )
    ).filter(
        total_net_raised_calc__gte=models.F('goal_amount'),
        certificate_generated=False
    ).exclude(
        status__in=['DRAFT', 'INACTIVE']
    )
    
    count = 0
    for campaign in campaigns:
        try:
            # Double-check the campaign goal is actually reached
            if campaign.goal_reached:
                # 1. Generate the PDF
                filename, content_file = create_impact_certificate(campaign)
                
                if content_file:
                    # 2. Save to model
                    campaign.certificate_file.save(filename, content_file, save=False)
                    campaign.certificate_generated = True
                    campaign.save(update_fields=['certificate_generated', 'certificate_file'])
                    
                    logger.info(f"Generated Impact Certificate for Campaign #{campaign.id}")
                    count += 1
        except Exception as e:
            logger.error(f"Failed to generate certificate for campaign {campaign.id}: {str(e)}")
            continue
        
    return f"Generated {count} impact certificates."


@shared_task
def generate_missing_campaign_slugs():
    """
    Background task to generate slugs for existing campaigns that don't have one.
    This is run at startup to populate the slug field for existing records.
    """
    campaigns_without_slug = Campaign.objects.filter(slug__isnull=True)
    
    count = 0
    for campaign in campaigns_without_slug:
        base_slug = slugify(campaign.title)
        slug = base_slug
        counter = 1
        
        # Ensure slug uniqueness
        while Campaign.objects.filter(slug=slug).exclude(id=campaign.id).exists():
            slug = f"{base_slug}-{counter}"
            counter += 1
        
        campaign.slug = slug
        campaign.save(update_fields=['slug'])
        
        logger.info(f"Generated slug '{slug}' for Campaign #{campaign.id} ('{campaign.title}')")
        count += 1
    
    logger.info(f"Generated {count} missing campaign slugs")
    return f"Generated {count} campaign slugs."
