import uuid
from django.db import models
from django.conf import settings


class TicketMessage(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    ticket = models.ForeignKey(
        "SupportTicket", on_delete=models.CASCADE, related_name="messages"
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="ticket_messages",
    )
    message = models.TextField()
    is_internal = models.BooleanField(
        default=False,
        help_text="Internal notes are only visible to system admins",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]
        indexes = [
            models.Index(fields=["ticket", "created_at"]),
            models.Index(fields=["sender"]),
        ]

    def __str__(self):
        return f"Message by {self.sender.email} on {self.ticket.ticket_number}"
