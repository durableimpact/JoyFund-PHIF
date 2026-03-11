from django.db import models
from accounts.models import SocialWorker
import uuid

# Create your models here.

class Gender(models.TextChoices):
    MALE = 'MALE', 'Male'
    FEMALE = 'FEMALE', 'Female'
    OTHER = 'OTHER', 'Other'

class Beneficiary(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    full_name = models.CharField(max_length=255)
    date_of_birth = models.DateField()
    gender = models.CharField(max_length=20, choices=Gender.choices, default=Gender.OTHER)
    
    phone = models.CharField(max_length=15)
    email = models.EmailField(null=True, blank=True)
    
    region = models.CharField(max_length=100)
    city = models.CharField(max_length=100)
    address = models.TextField()

    national_id_number = models.CharField(max_length=100, unique=True)

    emergency_contact_name = models.CharField(max_length=255)
    emergency_contact_phone = models.CharField(max_length=20)
    emergency_contact_relationship = models.CharField(max_length=100)
    
    chronic_conditions = models.TextField(null=True, blank=True)
    expected_delivery_date = models.DateField(null=True, blank=True)

    enrolled_by = models.ForeignKey(SocialWorker, on_delete=models.CASCADE, related_name='beneficiaries')
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.full_name

    