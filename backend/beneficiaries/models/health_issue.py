from django.db import models
from accounts.models import SocialWorker
from .beneficiary import Beneficiary

class HealthIssueCategoryChoices(models.TextChoices):
    MATERNAL = 'MATERNAL', 'Maternal Health Issue'
    ELDERLY = 'ELDERLY', 'Elderly Health Issue'
    EMERGENCY = 'EMERGENCY', 'Emergency Health Issue'
    CHRONIC = 'CHRONIC', 'Chronic Health Issue'
    OTHER = 'OTHER', 'Other Health Issue'

class HealthIssueSeverityLevel(models.TextChoices):
    LOW = 'LOW', 'Low Severity'
    MEDIUM = 'MEDIUM', 'Medium Severity'
    HIGH = 'HIGH', 'High Severity'
    CRITICAL = 'CRITICAL', 'Critical Severity'

class HealthIssueStatus(models.TextChoices):
    REPORTED = 'REPORTED', 'Reported'
    VALIDATED = 'VALIDATED', 'Validated'
    WAITING = 'WAITING', 'Waiting for Funds'
    ASSIGNED = 'ASSIGNED', 'Assigned to Voucher'
    IN_TREATMENT = 'IN_TREATMENT', 'In Treatment'
    RESOLVED = 'RESOLVED', 'Resolved'
    REJECTED = 'REJECTED', 'Rejected'

class HealthIssue(models.Model):
    beneficiary = models.ForeignKey(
        Beneficiary, on_delete=models.CASCADE, related_name='health_issues'
    )
    social_worker = models.ForeignKey(
        SocialWorker, on_delete=models.SET_NULL, null=True, blank=True, related_name='reported_health_issues'
    )
    category = models.CharField(
        max_length=20, choices=HealthIssueCategoryChoices.choices, default=HealthIssueCategoryChoices.OTHER
    )
    severity = models.CharField(
        max_length=10, choices=HealthIssueSeverityLevel.choices, default=HealthIssueSeverityLevel.LOW
    )
    status = models.CharField(
        max_length=20, choices=HealthIssueStatus.choices, default=HealthIssueStatus.REPORTED
    )
    description = models.TextField()
    created_at = models.DateField(auto_now_add=True)
    updated_at = models.DateField(auto_now=True)

    def __str__(self):
        return f"Health Issue for {self.beneficiary.digital_health_id}: {self.description[:30]}..."
