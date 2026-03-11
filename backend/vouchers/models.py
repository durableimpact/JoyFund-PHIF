from django.db import models
from django.conf import settings
import uuid

class Beneficiary(models.Model):
    CATEGORY = [('MATERNAL', 'Pregnant Woman'), ('ELDERLY', 'Elderly')]
    
    full_name = models.CharField(max_length=255)
    phone_number = models.CharField(max_length=15)
    location = models.CharField(max_length=100)
    category = models.CharField(max_length=10, choices=CATEGORY)
    is_verified = models.BooleanField(default=False)
    verified_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        limit_choices_to={'role': 'STAFF'}
    )

    def __str__(self):
        return self.full_name

class CareVoucher(models.Model):
    STATUS = [
        ('AVAILABLE', 'Available'),
        ('LOCKED', 'Checked-In at Hospital'),
        ('REDEEMED', 'Care Completed'),
        ('EXPIRED', 'Expired'),
    ]

    # The 6-digit code for the SMS
    voucher_code = models.CharField(max_length=8, unique=True, editable=False)
    beneficiary = models.ForeignKey(Beneficiary, on_delete=models.CASCADE)
    hospital = models.ForeignKey('hospitals.Hospital', on_delete=models.SET_NULL, null=True)
    service_description = models.CharField(max_length=255) # e.g., "Normal Delivery"
    value = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=15, choices=STATUS, default='AVAILABLE')
    
    # Anti-Fraud OTP
    patient_confirmation_otp = models.CharField(max_length=4, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    redeemed_at = models.DateTimeField(null=True, blank=True)

    def save(self, *args, **kwargs):
        if not self.voucher_code:
            # Logic to generate unique code like SHB-X89
            self.voucher_code = str(uuid.uuid4().hex[:6].upper())
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.voucher_code} - {self.beneficiary.full_name}"

class HospitalPayout(models.Model):
    voucher = models.OneToOneField(CareVoucher, on_delete=models.CASCADE)
    hospital = models.ForeignKey('hospitals.Hospital', on_delete=models.CASCADE)
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2)
    momo_transaction_id = models.CharField(max_length=100)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Payout for {self.voucher.voucher_code} to {self.hospital.name}"
