from django.contrib import admin
from support.models import SupportTicket, TicketMessage, TicketEvent


class TicketMessageInline(admin.TabularInline):
    model = TicketMessage
    extra = 0
    readonly_fields = ["sender", "message", "is_internal", "created_at"]
    can_delete = False

    def has_add_permission(self, request, obj=None):
        return False


class TicketEventInline(admin.TabularInline):
    model = TicketEvent
    extra = 0
    readonly_fields = ["status", "changed_by", "changed_at", "notes"]
    can_delete = False

    def has_add_permission(self, request, obj=None):
        return False


@admin.register(SupportTicket)
class SupportTicketAdmin(admin.ModelAdmin):
    list_display = [
        "ticket_number",
        "subject",
        "category",
        "priority",
        "status",
        "created_by",
        "assigned_to",
        "created_at",
    ]
    list_filter = ["status", "category", "priority", "created_at"]
    search_fields = ["ticket_number", "subject", "description", "created_by__email"]
    readonly_fields = [
        "ticket_number",
        "created_by",
        "created_at",
        "updated_at",
        "resolved_at",
        "closed_at",
    ]
    inlines = [TicketMessageInline, TicketEventInline]

    fieldsets = (
        (
            "Ticket Info",
            {
                "fields": (
                    "ticket_number",
                    "subject",
                    "description",
                    "category",
                    "priority",
                    "status",
                )
            },
        ),
        (
            "Assignment",
            {
                "fields": ("created_by", "assigned_to"),
            },
        ),
        (
            "Resolution",
            {
                "fields": ("resolution_notes", "resolved_at", "closed_at"),
            },
        ),
        (
            "Timestamps",
            {
                "fields": ("created_at", "updated_at"),
            },
        ),
    )

    def has_add_permission(self, request):
        return False


@admin.register(TicketMessage)
class TicketMessageAdmin(admin.ModelAdmin):
    list_display = ["ticket", "sender", "is_internal", "created_at"]
    list_filter = ["is_internal", "created_at"]
    search_fields = ["message", "sender__email", "ticket__ticket_number"]
    readonly_fields = ["ticket", "sender", "message", "is_internal", "created_at"]

    def has_add_permission(self, request):
        return False


@admin.register(TicketEvent)
class TicketEventAdmin(admin.ModelAdmin):
    list_display = ["ticket", "status", "changed_by", "changed_at"]
    list_filter = ["status", "changed_at"]
    search_fields = ["ticket__ticket_number", "notes"]
    readonly_fields = [
        "ticket",
        "status",
        "changed_by",
        "changed_at",
        "notes",
    ]

    def has_add_permission(self, request):
        return False
