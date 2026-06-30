from django.contrib import admin

from .models import Campaign, CampaignTransaction, Donation, Payment


class DonationInline(admin.TabularInline):
    model = Donation
    extra = 0
    fields = (
        "id",
        "donor",
        "donor_name",
        "amount",
        "status",
        "is_anonymous",
        "created_at",
    )
    readonly_fields = ("id", "created_at")
    can_delete = True


class PaymentInline(admin.TabularInline):
    model = Payment
    extra = 0
    fields = (
        "payment_id",
        "payment_method",
        "phone_number",
        "amount",
        "payment_status",
        "payment_reference",
        "created_at",
    )
    readonly_fields = ("payment_id", "created_at")
    can_delete = False


class CampaignTransactionInline(admin.TabularInline):
    model = CampaignTransaction
    extra = 0
    fields = (
        "transaction_type",
        "voucher_funding",
        "amount",
        "description",
        "created_at",
    )
    readonly_fields = ("id", "created_at")
    can_delete = False


@admin.action(description="Mark selected campaigns as private")
def mark_as_private(modeladmin, request, queryset):
    queryset.update(is_public=False)


@admin.action(description="Mark selected campaigns as public")
def mark_as_public(modeladmin, request, queryset):
    queryset.update(is_public=True)


@admin.register(Campaign)
class CampaignAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "donor",
        "goal_amount",
        "current_amount",
        "progress_percentage",
        "status",
        "is_active",
        "is_public",
        "created_at",
    )
    list_filter = ("status", "is_active", "is_public", "event_type", "created_at")
    search_fields = ("title", "description", "donor__user__email")
    readonly_fields = (
        "id",
        "current_amount",
        "progress_percentage",
        "start_date",
        "created_at",
    )
    actions = [mark_as_private, mark_as_public]

    fieldsets = (
        (
            "Basic Information",
            {
                "fields": (
                    "id",
                    "title",
                    "description",
                    "donor",
                    "cover_image",
                    "event_type",
                )
            },
        ),
        (
            "Campaign Goals",
            {
                "fields": (
                    "goal_amount",
                    "current_amount",
                    "progress_percentage",
                )
            },
        ),
        ("Timeline", {"fields": ("start_date", "end_date", "created_at")}),
        ("Status & Visibility", {"fields": ("status", "is_active", "is_public")}),
    )

    inlines = [DonationInline]
    list_per_page = 25
    ordering = ("-created_at",)


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = (
        "payment_id",
        "payment_method",
        "phone_number",
        "amount",
        "payment_status",
        "created_at",
    )
    list_filter = ("payment_status", "payment_method", "created_at")
    search_fields = ("payment_id", "phone_number", "payment_reference")
    readonly_fields = ("payment_id", "created_at", "updated_at")

    fieldsets = (
        (
            "Payment Details",
            {
                "fields": (
                    "payment_id",
                    "payment_method",
                    "phone_number",
                    "amount",
                    "app_amount",
                    "aggregator_fee",
                )
            },
        ),
        ("Status & Reference", {"fields": ("payment_status", "payment_reference")}),
        ("Timestamps", {"fields": ("created_at", "updated_at")}),
    )

    list_per_page = 25
    ordering = ("-created_at",)


@admin.register(Donation)
class DonationAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "campaign",
        "donor",
        "donor_name",
        "amount",
        "status",
        "is_anonymous",
        "created_at",
    )
    list_filter = ("status", "is_anonymous", "created_at", "campaign")
    search_fields = (
        "id",
        "donor_name",
        "campaign__title",
        "donor__user__email",
        "message",
    )
    readonly_fields = (
        "id",
        "created_at",
        "updated_at",
        "platform_fee_amount",
        "net_amount",
    )

    fieldsets = (
        (
            "Donation Information",
            {
                "fields": (
                    "id",
                    "campaign",
                    "donor",
                    "donor_name",
                    "amount",
                    "platform_fee_amount",
                    "net_amount",
                    "is_anonymous",
                )
            },
        ),
        ("Message & Status", {"fields": ("message", "status")}),
        ("Payment Reference", {"fields": ("payment",)}),
        ("Timestamps", {"fields": ("created_at", "updated_at")}),
    )

    list_per_page = 25
    ordering = ("-created_at",)


@admin.register(CampaignTransaction)
class CampaignTransactionAdmin(admin.ModelAdmin):
    list_display = ("id", "campaign", "transaction_type", "amount", "created_at")
    list_filter = ("transaction_type", "created_at", "campaign")
    search_fields = ("id", "campaign__title", "description")
    raw_id_fields = ("campaign", "voucher_funding")
    readonly_fields = ("id", "created_at")

    fieldsets = (
        (
            "Transaction Information",
            {"fields": ("id", "campaign", "transaction_type", "amount")},
        ),
        ("Details", {"fields": ("voucher_funding", "description")}),
        ("Timestamps", {"fields": ("created_at",)}),
    )

    list_per_page = 25
    ordering = ("-created_at",)
