from django.db import models
from .beneficiary import Beneficiary

class BeneficiaryDocument(models.Model):
    beneficiary = models.ForeignKey(Beneficiary, on_delete=models.CASCADE, related_name='documents')
    document = models.FileField(upload_to='beneficiaries/documents/')
    description = models.CharField(max_length=255, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Document for {self.beneficiary.digital_health_id} - {self.description[:30]}..."
