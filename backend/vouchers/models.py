from django.db import models
from django.conf import settings
import uuid

class CareVoucher(models.Model):
    STATUS = [
        ('AVAILABLE', 'Available'),
        ('LOCKED', 'Checked-In at Hospital'),
        ('REDEEMED', 'Care Completed'),
        ('EXPIRED', 'Expired'),
    ]

    # The 6-digit code for the SMS
    voucher_code = models.CharField(max_length=8, unique=True, editable=False)
    beneficiary = models.ForeignKey('beneficiaries.Beneficiary', on_delete=models.CASCADE)
    campaign = models.ForeignKey('campaigns.Campaign', null=True, blank=True, on_delete=models.SET_NULL)
    hospital = models.ForeignKey('hospitals.Hospital', on_delete=models.SET_NULL, null=True)
    service = models.ForeignKey('hospitals.Services', on_delete=models.SET_NULL, null=True, blank=True)
    value = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=15, choices=STATUS, default='AVAILABLE')
    
    # Anti-Fraud OTP
    patient_confirmation_otp = models.CharField(max_length=4, blank=True)
    proof_of_service_image = models.ImageField(upload_to='vouchers/proofs/', null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    locked_at = models.DateTimeField(null=True, blank=True)
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
