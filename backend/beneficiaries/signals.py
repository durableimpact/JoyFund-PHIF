from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model

from .models import Beneficiary, HealthIssue, HealthIssueStatus

User = get_user_model()


@receiver(post_save, sender=Beneficiary, dispatch_uid="beneficiary_created_push_admins")
def beneficiary_created_push_admins(sender, instance: Beneficiary, created, **kwargs):
    """Send web push to all SYSTEM_ADMIN users when a beneficiary is created."""
    if created:
        from notifications.webpush import send_push_notification_to_user

        admin_users = User.objects.filter(role="SYSTEM_ADMIN")
        for admin in admin_users:
            send_push_notification_to_user(
                user=admin,
                title="New Beneficiary Enrolled",
                body=f"{instance.full_name} has been enrolled as a new beneficiary.",
                url="/dashboard/system-admin/beneficiaries/",
                tag="new_beneficiary",
            )


@receiver(post_save, sender=HealthIssue, dispatch_uid="health_issue_created_push_admins")
def health_issue_created_push_admins(sender, instance: HealthIssue, created, **kwargs):
    """Send web push to all SYSTEM_ADMIN users when a health issue is created."""
    if created:
        from notifications.webpush import send_push_notification_to_user

        beneficiary_name = instance.beneficiary.full_name
        admin_users = User.objects.filter(role="SYSTEM_ADMIN")
        for admin in admin_users:
            send_push_notification_to_user(
                user=admin,
                title=f"Health Issue Reported: {instance.get_category_display()}",
                body=f"{beneficiary_name} reported a {instance.get_severity_display()} severity health issue.",
                url="/dashboard/system-admin/health-issues/",
                tag="new_health_issue",
            )


@receiver(post_save, sender=HealthIssue, dispatch_uid="health_issue_resolved_push_all")
def health_issue_resolved_push_all(sender, instance: HealthIssue, created, **kwargs):
    """Send web push to ALL users when a health issue is resolved."""
    if not created and instance.status == HealthIssueStatus.RESOLVED:
        from notifications.webpush import send_push_notification_to_all_users

        send_push_notification_to_all_users(
            title="Health Issue Resolved",
            body=f"A health issue for {instance.beneficiary.full_name} has been resolved!",
            url="/",
            tag="health_issue_resolved",
        )
