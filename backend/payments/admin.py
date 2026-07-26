from django.contrib import admin, messages
from django.db import transaction
from django.db.models import Sum, F
from django.utils.html import format_html, mark_safe

from .models import (
    Account,
    EscrowAccount,
    FeeAccount,
    FeePolicy,
    PaymentGateway,
    Transaction,
    FeeSplit,
    WebhookEvent,
    Disbursement,
)


@admin.register(Account)
class AccountAdmin(admin.ModelAdmin):
    list_display = ["id", "name", "balance", "updated_at"]
    list_filter = ["polymorphic_ctype"]
    search_fields = ["name"]
    readonly_fields = ["id", "created_at", "updated_at"]
    ordering = ["name"]

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(FeePolicy)
class FeePolicyAdmin(admin.ModelAdmin):
    list_display = [
        "name",
        "platform_fee_percentage",
        "escrow_fee_percentage",
        "active_badge",
        "created_at",
    ]
    list_filter = ["is_active"]
    search_fields = ["name", "description"]
    readonly_fields = ["created_at", "updated_at"]
    ordering = ["-created_at"]

    def active_badge(self, obj):
        if obj.is_active:
            return mark_safe(
                '<span style="color:green;font-weight:bold;">✔ Active</span>'
            )
        return mark_safe('<span style="color:#999;">Inactive</span>')

    active_badge.short_description = "Status"

    def save_model(self, request, obj, form, change):
        # model.save() already deactivates others — just call it normally.
        obj.save()


@admin.register(PaymentGateway)
class PaymentGatewayAdmin(admin.ModelAdmin):
    list_display = ["name", "is_active", "created_at"]
    list_filter = ["is_active"]
    search_fields = ["name", "description"]
    readonly_fields = ["created_at", "updated_at"]
    ordering = ["name"]


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "type",
        "direction",
        "amount",
        "currency",
        "status",
        "gateway",
        "created_at",
    ]
    list_filter = ["type", "direction", "status", "currency"]
    search_fields = ["gateway_transaction_id"]
    readonly_fields = [
        "id",
        "type",
        "direction",
        "amount",
        "currency",
        "gateway",
        "gateway_transaction_id",
        "status",
        "source",
        "destination",
        "donation",
        "metadata",
        "created_at",
        "updated_at",
    ]
    ordering = ["-created_at"]

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False


@admin.register(FeeSplit)
class FeeSplitAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "transaction",
        "fee_policy",
        "gross_amount",
        "escrow_amount",
        "platform_amount",
        "created_at",
    ]
    list_filter = ["fee_policy"]
    readonly_fields = [
        "id",
        "transaction",
        "fee_policy",
        "gross_amount",
        "escrow_amount",
        "platform_amount",
        "created_at",
    ]
    ordering = ["-created_at"]

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False


@admin.register(WebhookEvent)
class WebhookEventAdmin(admin.ModelAdmin):
    list_display = ["id", "gateway", "event_type", "received_at"]
    list_filter = ["gateway", "event_type"]
    search_fields = ["event_type"]
    readonly_fields = ["id", "gateway", "event_type", "payload", "received_at"]
    ordering = ["-received_at"]

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False


@admin.register(EscrowAccount)
class EscrowAccountAdmin(admin.ModelAdmin):
    list_display = ["name", "balance", "updated_at"]
    readonly_fields = ["id", "name", "created_at", "updated_at"]
    actions = ["recalculate_escrow_from_donations"]

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False

    @admin.action(description="Recalculate balance from successful donations")
    def recalculate_escrow_from_donations(self, request, queryset):
        from campaigns.models import Donation

        for account in queryset:
            old_balance = account.balance
            total_net = (
                Donation.objects.filter(status="SUCCESS").aggregate(
                    total=Sum("net_amount")
                )["total"]
                or 0
            )
            with transaction.atomic():
                EscrowAccount.objects.filter(pk=account.pk).update(
                    balance=total_net
                )
            self.message_user(
                request,
                f"{account.name}: balance updated from {old_balance} to {total_net} "
                f"(based on {Donation.objects.filter(status='SUCCESS').count()} successful donations).",
                messages.SUCCESS,
            )


@admin.register(FeeAccount)
class FeeAccountAdmin(admin.ModelAdmin):
    list_display = ["name", "balance", "updated_at"]
    readonly_fields = ["id", "name", "created_at", "updated_at"]
    actions = ["recalculate_fee_from_donations"]

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False

    @admin.action(description="Recalculate balance from successful donations")
    def recalculate_fee_from_donations(self, request, queryset):
        from campaigns.models import Donation

        for account in queryset:
            old_balance = account.balance
            total_fees = (
                Donation.objects.filter(status="SUCCESS").aggregate(
                    total=Sum("platform_fee_amount")
                )["total"]
                or 0
            )
            with transaction.atomic():
                FeeAccount.objects.filter(pk=account.pk).update(
                    balance=total_fees
                )
            self.message_user(
                request,
                f"{account.name}: balance updated from {old_balance} to {total_fees} "
                f"(based on {Donation.objects.filter(status='SUCCESS').count()} successful donations).",
                messages.SUCCESS,
            )


@admin.register(Disbursement)
class DisbursementAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "hospital",
        "amount",
        "currency",
        "payment_method",
        "status",
        "disbursed_at",
        "created_at",
    ]
    list_filter = ["status", "payment_method", "currency", "created_at"]
    search_fields = [
        "hospital__name",
        "external_reference",
        "gateway_transaction_id",
    ]
    readonly_fields = [
        "id",
        "created_at",
        "updated_at",
        "created_by",
    ]
    fieldsets = (
        ("Hospital & Amount", {
            "fields": ("hospital", "amount", "currency")
        }),
        ("Payment Details", {
            "fields": (
                "payment_method",
                "recipient_phone",
                "recipient_account",
            )
        }),
        ("Status & References", {
            "fields": (
                "status",
                "external_reference",
                "gateway_transaction_id",
                "transaction",
            )
        }),
        ("Additional Information", {
            "fields": (
                "notes",
                "error_message",
                "metadata",
                "disbursed_at",
            ),
            "classes": ("collapse",),
        }),
        ("Metadata", {
            "fields": ("created_by", "created_at", "updated_at"),
            "classes": ("collapse",),
        }),
    )
    ordering = ["-created_at"]
