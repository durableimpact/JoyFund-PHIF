import uuid
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class NotificationType(models.TextChoices):
    """Types of notifications users can receive."""
    WELCOME = 'WELCOME', 'Welcome'
    SYSTEM = 'SYSTEM', 'System'
    ANNOUNCEMENT = 'ANNOUNCEMENT', 'Announcement'
    ALERT = 'ALERT', 'Alert'
    CAMPAIGN_UPDATE = 'CAMPAIGN_UPDATE', 'Campaign Update'
    DONATION_RECEIVED = 'DONATION_RECEIVED', 'Donation Received'
    DONATION_SENT = 'DONATION_SENT', 'Donation Sent'
    BENEFICIARY_UPDATE = 'BENEFICIARY_UPDATE', 'Beneficiary Update'
    PAYMENT_NOTIFICATION = 'PAYMENT_NOTIFICATION', 'Payment Notification'
    VERIFICATION_STATUS = 'VERIFICATION_STATUS', 'Verification Status'
    SUPPORT_TICKET = 'SUPPORT_TICKET', 'Support Ticket'


class Notification(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    
    title = models.CharField(max_length=255, help_text="Notification title")
    message = models.TextField(help_text="Notification message body")
    description = models.TextField(blank=True, null=True, help_text="Additional description")
    
    notification_type = models.CharField(
        max_length=50, 
        choices=NotificationType.choices, 
        default=NotificationType.SYSTEM
    )
    
    is_read = models.BooleanField(default=False, help_text="Whether the user has read this notification")
    
    # Optional link for the notification
    action_url = models.URLField(blank=True, null=True, help_text="Link to take action on this notification")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['user', 'is_read']),
            models.Index(fields=['notification_type']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        email = self.user.email if self.user_id else "(no user)"
        return f"{self.title} - {email}"
