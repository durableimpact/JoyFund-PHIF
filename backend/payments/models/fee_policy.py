from django.db import models
from django.core.exceptions import ValidationError

class FeePolicy(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)

    platform_fee_percentage = models.DecimalField(
        max_digits=5, decimal_places=2)  # e.g. 2.5 for 2.5%
    escrow_fee_percentage = models.DecimalField(
        max_digits=5, decimal_places=2)  # e.g. 1.0 for 1%

    # the total of platform_fee_percentage + escrow_fee_percentage should ideally be  100%

    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def clean(self):
        total = self.platform_fee_percentage + self.escrow_fee_percentage
        if total != 100:
            raise ValidationError("Fee percentages must sum to 100%.")

    def save(self, *args, **kwargs):
        if self.is_active:
            # Deactivate every other policy before saving this one as active.
            FeePolicy.objects.exclude(pk=self.pk).filter(is_active=True).update(is_active=False)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name
