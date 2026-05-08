import uuid
from django.db import models
from accounts.models import SocialWorker

class Gender(models.TextChoices):
    MALE = 'MALE', 'Male'
    FEMALE = 'FEMALE', 'Female'
    OTHER = 'OTHER', 'Other'

class BeneficiaryCategory(models.TextChoices):
    MATERNAL = 'MATERNAL', 'Pregnant Woman'
    ELDERLY = 'ELDERLY', 'Elderly'
    OTHER = 'OTHER', 'Other'

class UrgencyLevel(models.TextChoices):
    ROUTINE = 'ROUTINE', 'Routine'
    URGENT = 'URGENT', 'Urgent'
    CRITICAL = 'CRITICAL', 'Critical'

class GeographicRemoteness(models.TextChoices):
    LOW = 'LOW', 'Low (Urban / Easy Access)'
    MEDIUM = 'MEDIUM', 'Medium (Peri-urban)'
    HIGH = 'HIGH', 'High (Rural / Remote)'

class Beneficiary(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    digital_health_id = models.CharField(max_length=20, unique=True, editable=False, null=True, blank=True)
    picture = models.ImageField(upload_to='beneficiaries/pictures/', null=True, blank=True)
    full_name = models.CharField(max_length=255)
    date_of_birth = models.DateField()
    gender = models.CharField(max_length=20, choices=Gender.choices, default=Gender.OTHER)
    category = models.CharField(
        max_length=20, choices=BeneficiaryCategory.choices, default=BeneficiaryCategory.OTHER
    )
    number_of_previous_births = models.IntegerField(default=0)
    is_verified = models.BooleanField(default=False)
    urgency_level = models.CharField(
        max_length=10, choices=UrgencyLevel.choices, default=UrgencyLevel.ROUTINE
    )
    geographic_remoteness = models.CharField(
        max_length=10, choices=GeographicRemoteness.choices, default=GeographicRemoteness.LOW
    )
    phone = models.CharField(max_length=15)
    email = models.EmailField(null=True, blank=True)
    language_preference = models.CharField(
        max_length=20, default='fr',
        help_text='ISO 639-1 code used for SMS dispatch, e.g. fr, en',
    )
    region = models.CharField(max_length=100)
    city = models.CharField(max_length=100)
    address = models.TextField()
    lat = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    lng = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    national_id_number = models.CharField(max_length=100, unique=True)
    emergency_contact_name = models.CharField(max_length=255)
    emergency_contact_phone = models.CharField(max_length=20)
    emergency_contact_relationship = models.CharField(max_length=100)
    enrolled_by = models.ForeignKey(
        SocialWorker, on_delete=models.CASCADE, related_name='beneficiaries'
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['digital_health_id']),
            models.Index(fields=['category']),
            models.Index(fields=['urgency_level']),
            models.Index(fields=['geographic_remoteness']),
            models.Index(fields=['enrolled_by', 'created_at']),
        ]

    def save(self, *args, **kwargs):
        if not self.digital_health_id:
            last_beneficiary = Beneficiary.objects.all().order_by('id').last()
            if last_beneficiary and last_beneficiary.digital_health_id:
                try:
                    last_id_num = int(last_beneficiary.digital_health_id.split('-')[1])
                    new_id_num = last_id_num + 1
                except (IndexError, ValueError):
                    new_id_num = Beneficiary.objects.count() + 1
            else:
                new_id_num = 1
            self.digital_health_id = f"BEN-{new_id_num:04d}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.full_name} ({self.digital_health_id})"
