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
    start_date = models.DateTimeField(auto_now_add=True)
    end_date = models.DateTimeField()

    is_public = models.BooleanField(default=True)

    status = models.CharField(max_length=20, choices=CAMPAIGN_STATUS, default='DRAFT')

    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['donor', 'created_at']),
            models.Index(fields=['created_at']),
        ]

    @property
    def progress_percentage(self):
        if self.goal_amount > 0:
            return (self.current_amount / self.goal_amount) * 100
        return 0

    def __str__(self):
        return self.title
    
class Payment(models.Model):
    PAYMENT_METHODS = [
        ('MTN', 'MTN Money'),
        ('ORANGE', 'Orange Money'),
    ]
    
    PAYMENT_STATUS = [
        ('PENDING', 'Pending'),
        ('SUCCESS', 'Success'),
        ('FAILED', 'Failed'),
    ]
    
    payment_id = models.UUIDField(primary_key=True,default=uuid.uuid4,editable=False)
    payment_method = models.CharField(max_length=10, choices=PAYMENT_METHODS)
    phone_number = models.CharField(max_length=20, blank=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS, default='PENDING')
    
    payment_reference = models.CharField(max_length=255,blank=True,null=True)

    created_at = models.DateField(auto_now_add=True)
    updated_at = models.DateField(auto_now=True)
    
    def __str__(self):
        return self.name
    
    

class Donation(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('SUCCESS', 'Success'),
        ('FAILED', 'Failed'),
    ]

    donation_id = models.UUIDField(primary_key=True,default=uuid.uuid4,editable=False)
    donor = models.ForeignKey(Donor, on_delete=models.SET_NULL, null=True, blank=True, related_name='donations')
    campaign = models.ForeignKey(Campaign, on_delete=models.CASCADE, related_name='donations')
    donor_name = models.CharField(max_length=100,blank=True,null=True, default="Anonymous")
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='PENDING')
    message = models.TextField(blank=True) # "Congrats Junior!"
    
    is_anonymous = models.BooleanField(default=False)
    payment = models.OneToOneField(Payment,on_delete=models.CASCADE,related_name='donation')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['campaign']),
            models.Index(fields=['donor']),
        ]

    def __str__(self):
        return f"{self.amount} XAF to {self.campaign.title} by {self.donor_name}"
