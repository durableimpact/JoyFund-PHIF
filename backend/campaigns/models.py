from django.db import models
from django.conf import settings
import uuid
from accounts.models import Donor

class Campaign(models.Model):
    EVENT_TYPES = [
        ('BIRTHDAY', 'Birthday'),
        ('WEDDING', 'Wedding'),
        ('PROMOTION', 'Job Promotion'),
        ('GRADUATION', 'Graduation'),
        ('MEMORIAL', 'Memorial'),
    ]


    CAMPAIGN_STATUS = [
        ('DRAFT','DRAFT'),
        ('ACTIVE','ACTIVE'),
        ('INACTIVE','INACTIVE'),
        ('FUNDED','FUNDED'),
        ('CLOSED','CLOSED'),
        ('CANCELLED','CANCELLED'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    donor = models.ForeignKey(Donor, on_delete=models.CASCADE, related_name='my_campaigns')
    title = models.CharField(max_length=200)
    description = models.TextField()
    cover_image = models.ImageField(upload_to='campaigns/', null=True, blank=True)
    event_type = models.CharField(max_length=20, choices=EVENT_TYPES)
    
    goal_amount = models.DecimalField(max_digits=12, decimal_places=2) # In XAF
    current_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    impact_goal_count = models.IntegerField(default=1) 
    impact_service_category = models.CharField(max_length=50, blank=True)
    account = models.OneToOneField('payments.CampaignAccount', on_delete=models.SET_NULL, null=True, blank=True, related_name='campaign')
    
    start_date = models.DateTimeField(auto_now_add=True)
    end_date = models.DateTimeField()

    is_public = models.BooleanField(default=True)

    status = models.CharField(max_length=20, choices=CAMPAIGN_STATUS, default='DRAFT')

    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    @property
    def progress_percentage(self):
        if self.goal_amount > 0:
            return (self.current_amount / self.goal_amount) * 100
        return 0

    def __str__(self):
        return self.title

class Donation(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('SUCCESS', 'Success'),
        ('FAILED', 'Failed'),
    ]

    donor = models.ForeignKey(Donor, on_delete=models.SET_NULL, null=True, blank=True, related_name='donations')
    campaign = models.ForeignKey(Campaign, on_delete=models.CASCADE, related_name='donations')
    donor_name = models.CharField(max_length=100,blank=True,null=True, default="Anonymous")
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    transaction_reference = models.CharField(max_length=100, unique=True) # From Payment Gateway
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='PENDING')
    message = models.TextField(blank=True) # "Congrats Junior!"
    
    payment_provider = models.CharField(max_length=50, blank=True) # "MTN Mobile Money"
    provider_transaction_id = models.CharField(max_length=100, blank=True) # From Payment Provider
    platform_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0) # Fee charged by JoyFund
    net_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0) # amount - platform_fee
    
    is_anonymous = models.BooleanField(default=False)
    
    confirm_at = models.DateTimeField(null=True, blank=True) # When payment is confirmed by provider
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.amount} XAF to {self.campaign.title} by {self.donor_name}"
