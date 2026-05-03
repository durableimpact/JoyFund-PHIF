from django.db import models
import uuid
from .campaign import Campaign
from vouchers.models import VoucherFunding

class CampaignTransaction(models.Model):
    
    class TransactionType(models.TextChoices):
        DONATION = 'DONATION', 'Donation'
        VOUCHER_ALLOCATED = 'VOUCHER_ALLOCATED', 'Voucher Allocated'
        HOSPITAL_SETTLED = 'HOSPITAL_SETTLED', 'Hospital Settled'
        SURPLUS_REFUND = 'SURPLUS_REFUND', 'Surplus Refund'
        VOUCHER_EXPIRED_RETURN = 'VOUCHER_EXPIRED_RETURN', 'Voucher Expired Return'
        
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    campaign = models.ForeignKey(
        Campaign, on_delete=models.CASCADE, related_name='transactions')
    transaction_type = models.CharField(max_length=50,choices=TransactionType.choices)
    voucher_funding = models.ForeignKey(
        VoucherFunding, on_delete=models.SET_NULL, null=True, blank=True, related_name='campaign_transactions')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=['campaign']),
            models.Index(fields=['transaction_type']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f"{self.transaction_type} of {self.amount} XAF for {self.campaign.title}"
