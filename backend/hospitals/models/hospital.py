import uuid
from django.contrib.gis.db import models


class PartnershipStatus(models.TextChoices):
    PENDING = "PENDING", "Pending"
    ACTIVE = "ACTIVE", "Active"
    INACTIVE = "INACTIVE", "Inactive"
    REJECTED = "REJECTED", "Rejected"


class Hospital(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    accreditation_number = models.CharField(max_length=255)
    licence_number = models.CharField(max_length=255)
    region = models.CharField(max_length=100)
    city = models.CharField(max_length=100)
    address = models.CharField(max_length=255)
    gps_coordinates = models.PointField(srid=4326, null=True, blank=True)
    lat = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    lng = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    phone_number = models.CharField(max_length=15)
    email = models.EmailField()
    website = models.URLField(null=True, blank=True)
    momo_number = models.CharField(max_length=15, blank=True, null=True)
    momo_name = models.CharField(max_length=100, blank=True, null=True)
    orange_number = models.CharField(max_length=15, blank=True, null=True)
    orange_name = models.CharField(max_length=100, blank=True, null=True)
    bank_account_number = models.CharField(max_length=15, blank=True, null=True)
    bank_account_name = models.CharField(max_length=100, blank=True, null=True)
    bank_name = models.CharField(max_length=100, blank=True, null=True)
    bank_branch = models.CharField(max_length=100, blank=True, null=True)
    partnership_status = models.CharField(
        max_length=20,
        choices=PartnershipStatus.choices,
        default=PartnershipStatus.PENDING,
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if self.gps_coordinates:
            self.lat = self.gps_coordinates.y
            self.lng = self.gps_coordinates.x
        elif (
            self.gps_coordinates is None
            and self.lat is not None
            and self.lng is not None
        ):
            self.gps_coordinates = Point(float(self.lng), float(self.lat), srid=4326)
        super().save(*args, **kwargs)

    class Meta:
        indexes = [
            models.Index(fields=["partnership_status"]),
            models.Index(fields=["region", "city"]),
            models.Index(fields=["is_active"]),
        ]

    def __str__(self):
        return self.name
