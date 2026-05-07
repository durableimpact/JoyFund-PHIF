from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import HealthIssue,HealthIssueStatus


@receiver(post_save,sender=HealthIssue)
def send_notifications_to_admin(sender,instance:HealthIssue,created,**kwargs):
    if created:
        # send notification to admin
        pass

@receiver(post_save, sender=HealthIssue)
def health_issue_status_change_notification(sender, instance: HealthIssue, created, **kwargs):
    """
    Check if the health issue status has been changed
    """
    
    if not created:
        if instance.status == HealthIssueStatus.VALIDATED:
            # create voucher for the health issue
            pass
        elif instance.status == HealthIssueStatus.REJECTED:
            # notify beneficiary of rejection
            pass
        elif instance.status == HealthIssueStatus.RESOLVED:
            # notify beneficiary of resolution
            pass