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
from django.db.models import Case, DecimalField, IntegerField, Q, Sum, Value
from django.db.models.functions import Coalesce

logger = logging.getLogger(__name__)

REMINDER_INTERVALS = {
    "15min": 15 * 60,
    "1hr": 60 * 60,
    "2hr": 2 * 60 * 60,
    "3hr": 3 * 60 * 60,
    "4hr": 4 * 60 * 60,
    "6hr": 6 * 60 * 60,
}

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
            Sum("donations__net_amount", filter=Q(donations__status="SUCCESS")),
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


REMINDER_MESSAGES = {
    "15min": {
        "title": "Start your campaign strong!",
        "message": "Your campaign '{title}' is live but hasn't received any donations yet. Be the first to contribute and encourage others!",
    },
    "1hr": {
        "title": "Your campaign needs a boost",
        "message": "It's been 1 hour since you created '{title}'. A first donation can spark momentum — consider contributing now!",
    },
    "2hr": {
        "title": "Don't let your campaign stall",
        "message": "2 hours in and '{title}' still has no donations. Share the link or make the first contribution to get things started!",
    },
    "3hr": {
        "title": "Your campaign is waiting",
        "message": "3 hours have passed since '{title}' was created. Early donations build trust — make the first move!",
    },
    "4hr": {
        "title": "Time is running out to get noticed",
        "message": "Your campaign '{title}' has been live for 4 hours without donations. Don't let it fade — contribute or share now!",
    },
    "6hr": {
        "title": "Final reminder before your campaign expires",
        "message": "It's been 6 hours since '{title}' was created with zero donations. Campaigns without donations are automatically removed after 8 hours. Act now!",
    },
}


@shared_task(bind=True, max_retries=2)
def send_campaign_donation_reminder(self, campaign_id, reminder_type):
    """
    Send a donation reminder to the campaign creator.

    Checks that:
      1. The campaign still exists and has no successful donations.
      2. The campaign hasn't already received a donation (race condition guard).
    If conditions are met, creates a Notification DB record and sends a push notification.
    """
    from notifications.models import Notification, NotificationType
    from notifications.webpush import send_push_notification_to_user

    try:
        campaign = Campaign.objects.select_related("donor__user").get(id=campaign_id)
    except Campaign.DoesNotExist:
        logger.warning(f"Campaign {campaign_id} not found, skipping reminder")
        return

    # Skip if the campaign has received any successful donation
    if campaign.has_successful_donation:
        logger.info(f"Campaign {campaign_id} already has donations, skipping {reminder_type} reminder")
        return

    # Skip if the campaign was already deleted (8h auto-delete)
    donor_user = campaign.donor.user if campaign.donor else None
    if not donor_user:
        logger.warning(f"Campaign {campaign_id} has no donor user, skipping reminder")
        return

    msg = REMINDER_MESSAGES.get(reminder_type)
    if not msg:
        logger.error(f"Unknown reminder type: {reminder_type}")
        return

    title = msg["title"]
    message = msg["message"].format(title=campaign.title)
    action_url = f"/campaign/{campaign.id}/"

    # 1. Create DB notification
    Notification.objects.create(
        user=donor_user,
        title=title,
        message=message,
        description=f"Campaign '{campaign.title}' has not received any donations yet.",
        notification_type=NotificationType.CAMPAIGN_UPDATE,
        action_url=action_url,
    )

    # 2. Send push notification
    try:
        send_push_notification_to_user(
            user=donor_user,
            title=title,
            body=message,
            url=action_url,
            tag=f"campaign_reminder_{campaign.id}",
            actions=[
                {"action": "donate", "title": "Donate Now"},
                {"action": "view", "title": "View Campaign"},
            ],
        )
    except Exception as e:
        logger.error(f"Failed to send push reminder for campaign {campaign_id}: {e}")

    logger.info(f"Sent {reminder_type} reminder for campaign {campaign_id} to {donor_user.email}")
    return f"Sent {reminder_type} reminder for campaign {campaign_id}"


@shared_task
def schedule_campaign_reminders(campaign_id):
    """
    Schedule all donation reminder tasks for a newly created campaign.
    Called from the Campaign post_save signal on creation.
    Each reminder checks internally if donations have been made before sending.
    """
    for reminder_type, delay_seconds in REMINDER_INTERVALS.items():
        send_campaign_donation_reminder.apply_async(
            args=[campaign_id, reminder_type],
            countdown=delay_seconds,
        )
        logger.info(
            f"Scheduled '{reminder_type}' reminder for campaign {campaign_id} "
            f"in {delay_seconds}s"
        )
    return f"Scheduled {len(REMINDER_INTERVALS)} reminders for campaign {campaign_id}"


@shared_task
def auto_delete_empty_campaigns():
    """
    Periodic task: delete campaigns older than 8 hours that have zero successful donations.
    Runs via Celery Beat every 5 minutes.
    Campaigns with at least 1 successful donation are protected from deletion.
    """
    cutoff = timezone.now() - timedelta(hours=8)

    # Find old, private campaigns with no donations
    empty_campaigns = Campaign.objects.filter(
        created_at__lt=cutoff,
        is_public=False,
    ).annotate(
        donation_count=Sum(
            Case(
                Q(donations__status="SUCCESS"),
                then=1,
                default=0,
                output_field=models.IntegerField(),
            )
        )
    ).filter(donation_count=0)

    count = 0
    for campaign in empty_campaigns:
        try:
            campaign_id = campaign.id
            campaign_title = campaign.title
            campaign.delete()
            logger.info(f"Auto-deleted empty campaign '{campaign_title}' ({campaign_id}) after 8h")
            count += 1
        except Exception as e:
            logger.error(f"Failed to auto-delete campaign {campaign.id}: {e}")

    if count > 0:
        logger.info(f"Auto-deleted {count} empty campaigns")
    return f"Auto-deleted {count} empty campaigns"
