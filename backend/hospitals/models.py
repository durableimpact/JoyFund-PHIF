from django.contrib.gis.db import models
import uuid

# Create your models here.


class PartnershipStatus(models.TextChoices):
    PENDING = 'PENDING', 'Pending'
    ACTIVE = 'ACTIVE', 'Active'
    INACTIVE = 'INACTIVE', 'Inactive'
    REJECTED = 'REJECTED', 'Rejected'


class Hospital(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    name = models.CharField(max_length=255)
    
    accreditation_number = models.CharField(max_length=255)
    licence_number = models.CharField(max_length=255)

    region = models.CharField(max_length=100)
    city = models.CharField(max_length=100)
    address = models.CharField(max_length=255)
    
    # Stored as WGS-84 longitude/latitude point (SRID 4326)
    gps_coordinates = models.PointField(srid=4326, null=True, blank=True)

    phone_number = models.CharField(max_length=15)
    email = models.EmailField()
    website = models.URLField(null=True, blank=True)
    
    momo_number = models.CharField(max_length=15,blank=True,null=True)
    momo_name = models.CharField(max_length=100,blank=True,null=True)

    orange_number = models.CharField(max_length=15,blank=True,null=True)
    orange_name = models.CharField(max_length=100,blank=True,null=True)

    bank_account_number = models.CharField(max_length=15,blank=True,null=True)
    bank_account_name = models.CharField(max_length=100,blank=True,null=True)
    bank_name = models.CharField(max_length=100,blank=True,null=True)
    bank_branch = models.CharField(max_length=100,blank=True,null=True)
    
    partnership_status = models.CharField(max_length=20, choices=PartnershipStatus.choices, default=PartnershipStatus.PENDING)
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class Services(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    hospital = models.ForeignKey(Hospital, on_delete=models.CASCADE, related_name='services')
    name = models.CharField(max_length=255)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    is_available = models.BooleanField(default=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)