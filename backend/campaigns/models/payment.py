from django.db import models
import uuid

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

    payment_id = models.UUIDField(
        primary_key=True, default=uuid.uuid4, editable=False)
    payment_method = models.CharField(max_length=10, choices=PAYMENT_METHODS)
    phone_number = models.CharField(max_length=20, blank=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_status = models.CharField(
        max_length=20, choices=PAYMENT_STATUS, default='PENDING')

    payment_reference = models.CharField(max_length=255, blank=True, null=True)

    created_at = models.DateField(auto_now_add=True)
    updated_at = models.DateField(auto_now=True)

    def __str__(self):
        return f"{self.payment_id} - {self.amount} XAF ({self.payment_status})"
