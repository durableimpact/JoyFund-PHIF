from django.contrib import admin
from .models import Voucher, VoucherFunding, VoucherNotification


@admin.register(Voucher)
class VoucherAdmin(admin.ModelAdmin):
    list_display = (
        "voucher_code",
        "get_beneficiary",
        "hospital",
        "status",
        "expiry_date",
        "created_at",
    )
    list_filter = ("status", "hospital", "created_at", "expiry_date")
    search_fields = (
        "voucher_code",
        "beneficiary__full_name",
        "beneficiary__digital_health_id",
        "hospital__name",
    )
    raw_id_fields = ("beneficiary", "health_issue", "hospital")
    readonly_fields = ("created_at", "locked_at", "redeemed_at", "expired_at")
    date_hierarchy = "created_at"

    fieldsets = (
        (
            "Voucher Information",
            {"fields": ("beneficiary", "health_issue", "hospital")},
        ),
        ("Status & Language", {"fields": ("status", "language_preference")}),
        (
            "Dates",
            {
                "fields": (
                    "expiry_date",
                    "created_at",
                    "locked_at",
                    "redeemed_at",
                    "expired_at",
                )
            },
        ),
        (
            "PIN & Reminders",
            {
                "fields": (
                    "patient_confirmation_pin",
                    "reminder_20_sent",
                    "reminder_28_sent",
                ),
                "classes": ("collapse",),
            },
        ),
    )

    list_per_page = 25
    ordering = ("-created_at",)

    @admin.display(description="Beneficiary")
    def get_beneficiary(self, obj):
        return f"{obj.beneficiary.full_name}"


@admin.register(VoucherFunding)
class VoucherFundingAdmin(admin.ModelAdmin):
    list_display = ("id", "get_voucher", "campaign", "committed_amount", "status")
    list_filter = ("campaign", "status", "committed_at")
    search_fields = ("voucher__voucher_code", "campaign__title")
    raw_id_fields = ("voucher", "campaign")
    readonly_fields = ("committed_at", "utilized_at", "cancelled_at")

    fieldsets = (
        ("Funding Information", {"fields": ("voucher", "campaign", "status")}),
        (
            "Amounts",
            {"fields": ("committed_amount", "utilized_amount", "refund_amount")},
        ),
        (
            "Timeline",
            {
                "fields": ("committed_at", "utilized_at", "cancelled_at"),
                "classes": ("collapse",),
            },
        ),
    )

    list_per_page = 25
    ordering = ("-committed_at",)

    @admin.display(description="Voucher")
    def get_voucher(self, obj):
        return obj.voucher.voucher_code


@admin.register(VoucherNotification)
class VoucherNotificationAdmin(admin.ModelAdmin):
    list_display = ("id", "get_voucher", "moment", "is_read", "created_at")
    list_filter = ("moment", "is_read", "created_at")
    search_fields = (
        "voucher__voucher_code",
        "message",
        "donor__user__email" if hasattr("donor", "__bool__") else "",
    )
    raw_id_fields = ("voucher", "campaign", "donor")
    readonly_fields = ("created_at",)

    fieldsets = (
        ("Notification Information", {"fields": ("voucher", "moment", "message")}),
        ("Related", {"fields": ("campaign", "donor")}),
        ("Status", {"fields": ("is_read", "created_at")}),
    )

    list_per_page = 25
    ordering = ("-created_at",)

    @admin.display(description="Voucher")
    def get_voucher(self, obj):
        return obj.voucher.voucher_code
