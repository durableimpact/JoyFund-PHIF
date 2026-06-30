"""
Django signals for the support app.
"""

import logging

from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model

from support.models import SupportTicket, TicketMessage, TicketStatus

User = get_user_model()
logger = logging.getLogger("support")


@receiver(post_save, sender=SupportTicket, dispatch_uid="notify_admins_new_ticket")
def notify_admins_new_ticket(sender, instance, created, **kwargs):
    """
    Notify all system admins when a new support ticket is created.
    """
    if not created:
        return

    from notifications.models import Notification, NotificationType

    admin_users = User.objects.filter(role="SYSTEM_ADMIN", is_active=True)

    for admin in admin_users:
        Notification.objects.create(
            user=admin,
            title=f"New Support Ticket: {instance.ticket_number}",
            message=f"A new support ticket has been created by {instance.created_by.email}.\n\nSubject: {instance.subject}\nCategory: {instance.get_category_display()}\nPriority: {instance.get_priority_display()}",
            notification_type=NotificationType.SYSTEM,
            action_url=f"/dashboard/system-admin/support/{instance.id}",
        )

    logger.info(
        f"New ticket {instance.ticket_number} created by {instance.created_by.email}. "
        f"Notified {admin_users.count()} admin(s)."
    )


@receiver(post_save, sender=TicketMessage, dispatch_uid="notify_ticket_message")
def notify_ticket_message(sender, instance, created, **kwargs):
    """
    Notify the relevant party when a new message is added to a ticket.
    - If admin sends → notify ticket creator
    - If user sends → notify assigned admin or all admins
    """
    if not created or instance.is_internal:
        return

    from notifications.models import Notification, NotificationType

    ticket = instance.ticket
    sender = instance.sender

    if sender.role == "SYSTEM_ADMIN":
        Notification.objects.create(
            user=ticket.created_by,
            title=f"New reply on ticket {ticket.ticket_number}",
            message=f"An administrator has replied to your support ticket.\n\nSubject: {ticket.subject}",
            notification_type=NotificationType.SYSTEM,
            action_url=f"/dashboard/{ticket.created_by.role.lower()}/support/{ticket.id}",
        )
    else:
        if ticket.assigned_to:
            Notification.objects.create(
                user=ticket.assigned_to,
                title=f"New message on ticket {ticket.ticket_number}",
                message=f"A user has replied to ticket {ticket.ticket_number}.\n\nSubject: {ticket.subject}",
                notification_type=NotificationType.SYSTEM,
                action_url=f"/dashboard/system-admin/support/{ticket.id}",
            )
        else:
            admin_users = User.objects.filter(role="SYSTEM_ADMIN", is_active=True)
            for admin in admin_users:
                Notification.objects.create(
                    user=admin,
                    title=f"New message on ticket {ticket.ticket_number}",
                    message=f"A user has replied to ticket {ticket.ticket_number}.\n\nSubject: {ticket.subject}",
                    notification_type=NotificationType.SYSTEM,
                    action_url=f"/dashboard/system-admin/support/{ticket.id}",
                )

    logger.info(
        f"New message on ticket {ticket.ticket_number} by {sender.email}."
    )


@receiver(post_save, sender=SupportTicket, dispatch_uid="notify_ticket_status_change")
def notify_ticket_status_change(sender, instance, created, **kwargs):
    """
    Notify the ticket creator when the ticket status changes.
    """
    if created:
        return

    from notifications.models import Notification, NotificationType

    if instance.status in [TicketStatus.RESOLVED, TicketStatus.CLOSED]:
        status_display = instance.get_status_display()
        Notification.objects.create(
            user=instance.created_by,
            title=f"Ticket {instance.ticket_number} {status_display}",
            message=f"Your support ticket has been {status_display.lower()}.\n\nSubject: {instance.subject}",
            notification_type=NotificationType.SYSTEM,
            action_url=f"/dashboard/{instance.created_by.role.lower()}/support/{instance.id}",
        )
        logger.info(
            f"Ticket {instance.ticket_number} status changed to {instance.status}. "
            f"Notified {instance.created_by.email}."
        )
