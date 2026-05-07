from django.contrib import admin
from django.utils.html import format_html

from .models import (
    Account, EscrowAccount, FeeAccount,
    FeePolicy, PaymentGateway,
    Transaction, FeeSplit, WebhookEvent,HospitalAccount
)

@admin.register(FeePolicy)
class FeePolicyAdmin(admin.ModelAdmin):
    list_display = ['name', 'platform_fee_percentage', 'escrow_fee_percentage', 'active_badge', 'created_at']
    list_filter = ['is_active']
    search_fields = ['name', 'description']
    readonly_fields = ['created_at', 'updated_at']
    ordering = ['-created_at']

    def active_badge(self, obj):
        if obj.is_active:
            return format_html('<span style="color:green;font-weight:bold;">✔ Active</span>')
        return format_html('<span style="color:#999;">Inactive</span>')
    active_badge.short_description = 'Status'

    def save_model(self, request, obj, form, change):
        # model.save() already deactivates others — just call it normally.
        obj.save()


@admin.register(PaymentGateway)
class PaymentGatewayAdmin(admin.ModelAdmin):
    list_display = ['name', 'is_active', 'created_at']
    list_filter = ['is_active']
    search_fields = ['name', 'description']
    readonly_fields = ['created_at', 'updated_at']
    ordering = ['name']


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ['id', 'type', 'direction', 'amount', 'currency', 'status', 'gateway', 'created_at']
    list_filter = ['type', 'direction', 'status', 'currency']
    search_fields = ['gateway_transaction_id']
    readonly_fields = [
        'id', 'type', 'direction', 'amount', 'currency', 'gateway',
        'gateway_transaction_id', 'status', 'source', 'destination',
        'donation', 'metadata', 'created_at', 'updated_at',
    ]
    ordering = ['-created_at']

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False


@admin.register(FeeSplit)
class FeeSplitAdmin(admin.ModelAdmin):
    list_display = ['id', 'transaction', 'fee_policy', 'gross_amount', 'escrow_amount', 'platform_amount', 'created_at']
    list_filter = ['fee_policy']
    readonly_fields = ['id', 'transaction', 'fee_policy', 'gross_amount', 'escrow_amount', 'platform_amount', 'created_at']
    ordering = ['-created_at']

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False


@admin.register(WebhookEvent)
class WebhookEventAdmin(admin.ModelAdmin):
    list_display = ['id', 'gateway', 'event_type', 'received_at']
    list_filter = ['gateway', 'event_type']
    search_fields = ['event_type']
    readonly_fields = ['id', 'gateway', 'event_type', 'payload', 'received_at']
    ordering = ['-received_at']

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False


@admin.register(EscrowAccount)
class EscrowAccountAdmin(admin.ModelAdmin):
    list_display = ['name', 'balance', 'updated_at']
    readonly_fields = ['id', 'name', 'created_at', 'updated_at']

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(FeeAccount)
class FeeAccountAdmin(admin.ModelAdmin):
    list_display = ['name', 'balance', 'updated_at']
    readonly_fields = ['id', 'name', 'created_at', 'updated_at']

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(HospitalAccount)
class HospitalAccountAdmin(admin.ModelAdmin):
    list_display = ['hospital', 'balance', 'updated_at']
    readonly_fields = ['id', 'hospital', 'created_at', 'updated_at']
    search_fields = ['hospital__name']
    ordering = ['hospital__name']

    def has_add_permission(self, request):
        # Accounts are created automatically via signals when hospitals are created
        return False

    def has_delete_permission(self, request, obj=None):
        # Prevent accidental deletion of hospital ledger accounts
        return False
