import uuid
from django.db import models
from .hospital import Hospital


class ServiceCategory(models.TextChoices):
    GENERAL = "GENERAL", "General Consultation"
    MATERNITY = "MATERNITY", "Maternity / Obstetrics"
    PEDIATRIC = "PEDIATRIC", "Pediatric Care"
    LAB = "LAB", "Laboratory Services"
    IMAGING = "IMAGING", "Imaging (X-ray, Scan)"
    PHARMACY = "PHARMACY", "Pharmacy / Medication"
    SURGERY = "SURGERY", "Surgical Services"
    EMERGENCY = "EMERGENCY", "Emergency Care"
    CHRONIC = "CHRONIC", "Chronic Disease Management"
    VACCINATION = "VACCINATION", "Vaccination"
    DENTAL = "DENTAL", "Dental Care"
    OTHER = "OTHER", "Other"


class Services(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    hospital = models.ForeignKey(
        Hospital, on_delete=models.CASCADE, related_name="services"
    )
    name = models.CharField(max_length=255)
    category = models.CharField(
        max_length=20, choices=ServiceCategory.choices, default=ServiceCategory.OTHER
    )
    price = models.DecimalField(max_digits=10, decimal_places=2)
    is_available = models.BooleanField(default=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=["hospital"]),
            models.Index(fields=["is_available"]),
            models.Index(fields=["name"]),
        ]

    def __str__(self):
        return f"{self.name} - {self.hospital.name}"
